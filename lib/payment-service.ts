import Iyzipay from "iyzipay";
import { SubscriptionTier } from "@prisma/client";

import { BILLING_PLANS, type BillingCycle, getTierFromStripePriceId } from "@/lib/billing-config";
import { prisma } from "@/lib/prisma";
import { getStripe } from "@/lib/stripe";

export type PaymentProvider = "STRIPE" | "IYZICO";

type CreateSubscriptionArgs = {
  userId: string;
  origin: string;
  tier: SubscriptionTier;
  cycle: BillingCycle;
};

type CancelSubscriptionArgs = {
  userId: string;
};

type PortalArgs = {
  userId: string;
  origin: string;
};

type CoachBillingProfile = {
  userId: string;
  subscriptionTier: SubscriptionTier;
  subscriptionStatus: string | null;
  stripeCustomerId: string | null;
  user: {
    email: string;
    name: string;
    createdAt: Date;
  };
};

type FinalizeIyzicoCheckoutArgs = {
  token: string;
  origin: string;
};

export type ResolvedSubscription = {
  provider: PaymentProvider;
  tier: SubscriptionTier;
  status: string | null;
  active: boolean;
  stripeCustomerId: string | null;
};

function getLocalTierFallback(profile: CoachBillingProfile): SubscriptionTier {
  // Keep paid local tier when remote provider data is temporarily unavailable.
  return profile.subscriptionTier === "FREE"
    ? "FREE"
    : profile.subscriptionTier;
}

function getOrigin(origin?: string | null) {
  return origin ?? process.env.NEXTAUTH_URL ?? "http://localhost:3000";
}

export function getPaymentProvider(): PaymentProvider {
  const provider = (process.env.PAYMENT_PROVIDER ?? "STRIPE").toUpperCase();
  return provider === "IYZICO" ? "IYZICO" : "STRIPE";
}

function isActiveSubscriptionStatus(status?: string | null) {
  if (!status) return false;
  const normalized = status.toUpperCase();
  return ["ACTIVE", "TRIALING", "PAST_DUE", "UNPAID"].some((value) => normalized.includes(value));
}

function extractIyzicoReferenceCode(status?: string | null) {
  if (!status || !status.startsWith("IYZICO:")) return null;
  return status.split(":").slice(2).join(":") || null;
}

function normalizeIyzicoValue(value: unknown) {
  return typeof value === "string" ? value.toUpperCase() : null;
}

function formatIyzicoStatus(status: string, referenceCode?: string | null) {
  return referenceCode ? `IYZICO:${status}:${referenceCode}` : `IYZICO:${status}`;
}

function getBillingReturnUrl(origin: string, params: Record<string, string>) {
  const url = new URL("/coach/billing", getOrigin(origin));

  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }

  return url.toString();
}

async function getCoachBillingProfile(userId: string): Promise<CoachBillingProfile> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true, name: true, createdAt: true },
  });

  if (!user) {
    throw new Error("Coach user not found");
  }

  const profile = await prisma.coachProfile.findUnique({
    where: { userId },
    select: {
      subscriptionTier: true,
      subscriptionStatus: true,
      stripeCustomerId: true,
    },
  });

  return {
    userId,
    subscriptionTier: profile?.subscriptionTier ?? "FREE",
    subscriptionStatus: profile?.subscriptionStatus ?? null,
    stripeCustomerId: profile?.stripeCustomerId ?? null,
    user,
  };
}

async function listStripeSubscriptions(customerId: string) {
  const stripe = getStripe();
  const subscriptions = await stripe.subscriptions.list({ customer: customerId, limit: 10, status: "all" });
  const activeSubscription = subscriptions.data.find((item) =>
    ["active", "trialing", "past_due", "unpaid"].includes(item.status),
  ) ?? null;

  return { stripe, activeSubscription, subscriptions };
}

async function ensureStripeCustomer(profile: CoachBillingProfile) {
  if (profile.stripeCustomerId) return profile.stripeCustomerId;

  const stripe = getStripe();
  const customer = await stripe.customers.create({
    email: profile.user.email,
    name: profile.user.name,
    metadata: { userId: profile.userId },
  });

  await prisma.coachProfile.upsert({
    where: { userId: profile.userId },
    update: { stripeCustomerId: customer.id },
    create: { userId: profile.userId, stripeCustomerId: customer.id },
  });

  return customer.id;
}

function getIyzicoClient() {
  return new Iyzipay({
    apiKey: process.env.IYZIPAY_API_KEY ?? null,
    secretKey: process.env.IYZIPAY_SECRET_KEY ?? null,
    uri: process.env.IYZIPAY_URI ?? "https://sandbox-api.iyzipay.com",
  });
}

function iyzicoCreate(client: Iyzipay, resource: "subscriptionCheckoutForm" | "subscriptionCancel", request: Record<string, unknown>) {
  return new Promise<Record<string, unknown>>((resolve, reject) => {
    const callback = (error: unknown, result: Record<string, unknown>) => {
      if (error) {
        reject(error);
        return;
      }

      resolve(result);
    };

    if (resource === "subscriptionCheckoutForm") {
      client.subscriptionCheckoutForm.initialize(request, callback);
      return;
    }

    client.subscription.cancel(request, callback);
  });
}

function iyzicoRetrieveCheckoutForm(client: Iyzipay, checkoutFormToken: string) {
  return new Promise<Record<string, unknown>>((resolve, reject) => {
    client.subscriptionCheckoutForm.retrieve({ checkoutFormToken }, (error, result) => {
      if (error) {
        reject(error);
        return;
      }

      resolve(result);
    });
  });
}

export async function resolveCoachSubscription(userId: string): Promise<ResolvedSubscription> {
  const provider = getPaymentProvider();
  const profile = await getCoachBillingProfile(userId);
  const localTierFallback = getLocalTierFallback(profile);

  if (provider === "STRIPE") {
    if (!profile.stripeCustomerId) {
      return {
        provider,
        tier: localTierFallback,
        status: profile.subscriptionStatus,
        active: localTierFallback !== "FREE" || isActiveSubscriptionStatus(profile.subscriptionStatus),
        stripeCustomerId: null,
      };
    }

    try {
      const { activeSubscription } = await listStripeSubscriptions(profile.stripeCustomerId);
      if (!activeSubscription) {
        return {
          provider,
          tier: localTierFallback,
          status: profile.subscriptionStatus,
          active: localTierFallback !== "FREE",
          stripeCustomerId: profile.stripeCustomerId,
        };
      }

      const tier = getTierFromStripePriceId(activeSubscription.items.data[0]?.price.id) ?? profile.subscriptionTier;
      return {
        provider,
        tier,
        status: activeSubscription.status,
        active: true,
        stripeCustomerId: profile.stripeCustomerId,
      };
    } catch (error) {
      console.error("[payment-service] Failed to resolve Stripe subscription", error);
      return {
        provider,
        tier: localTierFallback,
        status: profile.subscriptionStatus,
        active: localTierFallback !== "FREE" || isActiveSubscriptionStatus(profile.subscriptionStatus),
        stripeCustomerId: profile.stripeCustomerId,
      };
    }
  }

  const active = isActiveSubscriptionStatus(profile.subscriptionStatus);
  return {
    provider,
    tier: active ? profile.subscriptionTier : "FREE",
    status: profile.subscriptionStatus,
    active,
    stripeCustomerId: profile.stripeCustomerId,
  };
}

export async function createSubscription({ userId, origin, tier, cycle }: CreateSubscriptionArgs) {
  const provider = getPaymentProvider();
  const profile = await getCoachBillingProfile(userId);

  if (provider === "STRIPE") {
    const customerId = await ensureStripeCustomer(profile);
    const stripe = getStripe();
    const priceId = BILLING_PLANS[tier].stripePriceIds?.[cycle];

    if (!priceId) {
      throw new Error("Selected Stripe plan is not configured");
    }

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: "subscription",
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${getOrigin(origin)}/coach/billing?success=1`,
      cancel_url: `${getOrigin(origin)}/coach/billing?canceled=1`,
      metadata: { userId, tier, cycle },
    });

    return { provider, url: session.url, raw: session };
  }

  const plan = BILLING_PLANS[tier];
  const pricingPlanReferenceCode = plan.iyzicoPricingPlanCodes?.[cycle];

  if (!pricingPlanReferenceCode) {
    throw new Error("Selected Iyzico pricing plan is not configured");
  }

  const iyzipay = getIyzicoClient();
  const callbackUrl = `${getOrigin(origin)}/api/webhooks/iyzico`;
  const conversationId = `${userId}:${tier}:${cycle}:${Date.now()}`;

  const result = await iyzicoCreate(iyzipay, "subscriptionCheckoutForm", {
    locale: Iyzipay.LOCALE.TR,
    conversationId,
    callbackUrl,
    pricingPlanReferenceCode,
    subscriptionInitialStatus: Iyzipay.SUBSCRIPTION_INITIAL_STATUS.ACTIVE,
    customer: {
      name: profile.user.name,
      surname: "Coach",
      identityNumber: "11111111111",
      email: profile.user.email,
      gsmNumber: "+905000000000",
      billingAddress: {
        contactName: profile.user.name,
        city: "Istanbul",
        country: "Turkey",
        address: "FitCoach Billing",
        zipCode: "34732",
      },
      shippingAddress: {
        contactName: profile.user.name,
        city: "Istanbul",
        country: "Turkey",
        address: "FitCoach Billing",
        zipCode: "34732",
      },
    },
  });

  const token = typeof result.token === "string" ? result.token : null;
  const url = typeof result.paymentPageUrl === "string"
    ? result.paymentPageUrl
    : token
      ? `${getOrigin(origin)}/coach/billing?provider=iyzico&token=${encodeURIComponent(token)}`
      : null;

  if (!url) {
    throw new Error("Iyzico checkout URL could not be generated");
  }

  await prisma.coachProfile.upsert({
    where: { userId },
    update: { subscriptionTier: tier, subscriptionStatus: token ? `IYZICO:PENDING:${token}` : "IYZICO:PENDING" },
    create: { userId, subscriptionTier: tier, subscriptionStatus: token ? `IYZICO:PENDING:${token}` : "IYZICO:PENDING" },
  });

  return { provider, url, raw: result };
}

export async function finalizeIyzicoCheckout({ token, origin }: FinalizeIyzicoCheckoutArgs) {
  const pendingProfile = await prisma.coachProfile.findFirst({
    where: { subscriptionStatus: `IYZICO:PENDING:${token}` },
    select: { userId: true, subscriptionTier: true },
  });

  if (!pendingProfile) {
    return {
      success: false,
      redirectUrl: getBillingReturnUrl(origin, { provider: "iyzico", canceled: "1", error: "unknown-checkout" }),
    };
  }

  const iyzipay = getIyzicoClient();
  const result = await iyzicoRetrieveCheckoutForm(iyzipay, token);
  const requestStatus = normalizeIyzicoValue(result.status);
  const paymentStatus = normalizeIyzicoValue(result.paymentStatus);
  const subscriptionStatus = normalizeIyzicoValue(result.subscriptionStatus);
  const subscriptionReferenceCode = typeof result.subscriptionReferenceCode === "string"
    ? result.subscriptionReferenceCode
    : null;
  const succeeded = requestStatus === "SUCCESS"
    && (paymentStatus === "SUCCESS" || subscriptionStatus === "ACTIVE" || Boolean(subscriptionReferenceCode));

  await prisma.coachProfile.update({
    where: { userId: pendingProfile.userId },
    data: {
      subscriptionTier: succeeded ? pendingProfile.subscriptionTier : "FREE",
      subscriptionStatus: succeeded
        ? formatIyzicoStatus(subscriptionStatus ?? "ACTIVE", subscriptionReferenceCode)
        : formatIyzicoStatus(subscriptionStatus ?? paymentStatus ?? "FAILED"),
    },
  });

  return {
    success: succeeded,
    redirectUrl: getBillingReturnUrl(origin, succeeded
      ? { provider: "iyzico", success: "1" }
      : { provider: "iyzico", canceled: "1", error: "payment-failed" }),
    raw: result,
  };
}

export async function cancelSubscription({ userId }: CancelSubscriptionArgs) {
  const provider = getPaymentProvider();
  const profile = await getCoachBillingProfile(userId);

  if (provider === "STRIPE") {
    if (!profile.stripeCustomerId) {
      await prisma.coachProfile.upsert({
        where: { userId },
        update: { subscriptionTier: "FREE", subscriptionStatus: "CANCELED" },
        create: { userId, subscriptionTier: "FREE", subscriptionStatus: "CANCELED" },
      });
      return { provider, canceled: true };
    }

    const { stripe, activeSubscription } = await listStripeSubscriptions(profile.stripeCustomerId);
    if (activeSubscription) {
      await stripe.subscriptions.cancel(activeSubscription.id);
    }

    await prisma.coachProfile.updateMany({
      where: { userId },
      data: { subscriptionTier: "FREE", subscriptionStatus: "CANCELED" },
    });

    return { provider, canceled: true };
  }

  const referenceCode = extractIyzicoReferenceCode(profile.subscriptionStatus);
  if (referenceCode) {
    const iyzipay = getIyzicoClient();
    await iyzicoCreate(iyzipay, "subscriptionCancel", { subscriptionReferenceCode: referenceCode });
  }

  await prisma.coachProfile.upsert({
    where: { userId },
    update: { subscriptionTier: "FREE", subscriptionStatus: "IYZICO:CANCELED" },
    create: { userId, subscriptionTier: "FREE", subscriptionStatus: "IYZICO:CANCELED" },
  });

  return { provider, canceled: true };
}

export async function getPortalUrl({ userId, origin }: PortalArgs) {
  const provider = getPaymentProvider();
  const profile = await getCoachBillingProfile(userId);

  if (provider === "STRIPE") {
    if (!profile.stripeCustomerId) {
      throw new Error("Stripe customer record not found");
    }

    const stripe = getStripe();
    const session = await stripe.billingPortal.sessions.create({
      customer: profile.stripeCustomerId,
      return_url: `${getOrigin(origin)}/coach/billing`,
    });

    return { provider, url: session.url, internal: false };
  }

  return {
    provider,
    url: `${getOrigin(origin)}/coach/billing?provider=iyzico&manage=1`,
    internal: true,
  };
}
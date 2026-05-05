import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { requireAuth } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import { BILLING_PLANS, getSupportedBillingCycles } from "@/lib/billing-config";
import { getPaymentProvider, resolveCoachSubscription } from "@/lib/payment-service";
import { TIER_CLIENT_LIMITS, TIER_LABELS } from "@/lib/subscription";
import { getStripe } from "@/lib/stripe";

function getQuotaState(usagePercent: number, currentClientCount: number, maxClients: number | null) {
  if (maxClients !== null && currentClientCount >= maxClients) return "full" as const;
  if (usagePercent >= 90) return "critical" as const;
  if (usagePercent >= 70) return "warning" as const;
  return "ok" as const;
}

function normalizeCurrency(currency?: string | null) {
  return (currency ?? "try").toUpperCase();
}

export async function GET() {
  try {
    const auth = await requireAuth("COACH");
    if (auth.error) return auth.error;

    const profile = await prisma.coachProfile.findUnique({
      where: { userId: auth.session.user.id },
      select: {
        subscriptionTier: true,
        subscriptionStatus: true,
        stripeCustomerId: true,
        user: {
          select: { createdAt: true },
        },
      },
    });

    const resolvedSubscription = await resolveCoachSubscription(auth.session.user.id);
    const tier = resolvedSubscription.tier;
    const paymentProvider = getPaymentProvider();
    const currentClientCount = await prisma.coachClientRelation.count({
      where: { coachId: auth.session.user.id, status: "ACCEPTED" },
    });

    const maxClients = TIER_CLIENT_LIMITS[tier] === Infinity ? null : TIER_CLIENT_LIMITS[tier];
    const remainingClients = maxClients === null ? null : Math.max(0, maxClients - currentClientCount);
    const usagePercent = maxClients === null ? 0 : Math.round((currentClientCount / maxClients) * 100);
    const supportedBillingCycles = getSupportedBillingCycles();

    let invoices: Array<{
      id: string;
      date: string;
      description: string;
      amount: number;
      currency: string;
      status: string;
      pdfUrl: string | null;
    }> = [];
    let paymentMethod: {
      brand: string;
      last4: string;
      expMonth: number;
      expYear: number;
    } | null = null;
    let totalPaid = 0;
    let renewalDate: string | null = null;
    let nextInvoiceDate: string | null = null;
    let activeSince: string | null = profile?.user.createdAt.toISOString() ?? null;
    let stripeConfigured = false;
    let currentBillingCycle: "monthly" | "yearly" = "monthly";

    if (paymentProvider === "STRIPE" && profile?.stripeCustomerId) {
      try {
        const stripe = getStripe();
        stripeConfigured = true;

        const [customer, subscriptions, invoiceList] = await Promise.all([
          stripe.customers.retrieve(profile.stripeCustomerId),
          stripe.subscriptions.list({ customer: profile.stripeCustomerId, limit: 10, status: "all" }),
          stripe.invoices.list({ customer: profile.stripeCustomerId, limit: 12 }),
        ]);

      const currentSubscription = subscriptions.data.find((item) =>
        ["active", "trialing", "past_due", "unpaid"].includes(item.status)
      ) ?? subscriptions.data[0];

      if (currentSubscription) {
        const currentPeriodEnd = (currentSubscription as Stripe.Subscription & { current_period_end?: number }).current_period_end;
        const startDate = (currentSubscription as Stripe.Subscription & { start_date?: number }).start_date;

        renewalDate = currentPeriodEnd ? new Date(currentPeriodEnd * 1000).toISOString() : null;
        nextInvoiceDate = renewalDate;
        currentBillingCycle = currentSubscription.items.data[0]?.price.recurring?.interval === "year" ? "yearly" : "monthly";
        activeSince = startDate ? new Date(startDate * 1000).toISOString() : activeSince;
      }

      invoices = invoiceList.data.map((invoice) => ({
        id: invoice.number || invoice.id,
        date: new Date(invoice.created * 1000).toISOString(),
        description: invoice.lines.data[0]?.description || invoice.description || `${TIER_LABELS[tier]} plani`,
        amount: (invoice.amount_paid || invoice.amount_due || 0) / 100,
        currency: normalizeCurrency(invoice.currency),
        status: invoice.status === "paid" ? "Odendi" : invoice.status || "Bekliyor",
        pdfUrl: invoice.invoice_pdf || invoice.hosted_invoice_url || null,
      }));

      totalPaid = invoiceList.data
        .filter((invoice) => invoice.status === "paid")
        .reduce((sum, invoice) => sum + (invoice.amount_paid || 0), 0) / 100;

      if (!customer.deleted) {
        const defaultPaymentMethod = customer.invoice_settings.default_payment_method;
        let paymentMethodObject: Stripe.PaymentMethod | null = null;

        if (typeof defaultPaymentMethod === "string") {
          paymentMethodObject = await stripe.paymentMethods.retrieve(defaultPaymentMethod);
        } else if (defaultPaymentMethod) {
          paymentMethodObject = defaultPaymentMethod;
        }

        if (paymentMethodObject?.type === "card" && paymentMethodObject.card) {
          paymentMethod = {
            brand: paymentMethodObject.card.brand,
            last4: paymentMethodObject.card.last4,
            expMonth: paymentMethodObject.card.exp_month,
            expYear: paymentMethodObject.card.exp_year,
          };
        }
      }
      } catch (error) {
        console.error("[api/coach/subscription] Failed to fetch Stripe billing details", error);
        stripeConfigured = false;
      }
    }

    return NextResponse.json({
      tier,
      label: TIER_LABELS[tier],
      maxClients,
      currentClientCount,
      remainingClients,
      usagePercent,
      quotaState: getQuotaState(usagePercent, currentClientCount, maxClients),
      currentPlanPrice: BILLING_PLANS[tier].price,
      currentBillingCycle,
      renewalDate,
      nextInvoiceDate,
      activeSince,
      totalPaid,
      stripeConfigured,
      paymentProvider,
      subscriptionStatus: resolvedSubscription.status ?? profile?.subscriptionStatus ?? null,
      supportedBillingCycles,
      invoices,
      paymentMethod,
      portalAvailable: paymentProvider === "IYZICO" ? true : stripeConfigured && Boolean(profile?.stripeCustomerId),
      plans: Object.values(BILLING_PLANS),
    });
  } catch (error) {
    console.error("[api/coach/subscription] Failed to load subscription details", error);
    return NextResponse.json({ error: "Abonelik bilgileri alınamadı." }, { status: 500 });
  }
}

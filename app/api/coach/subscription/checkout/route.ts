import { NextResponse } from "next/server";
import { SubscriptionTier } from "@prisma/client";
import { requireAuth } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import { getStripe, STRIPE_PRICE_IDS } from "@/lib/stripe";

const PLAN_TO_TIER: Record<"PRO" | "ELITE", SubscriptionTier> = {
  PRO: "TIER_1",
  ELITE: "TIER_2",
};

export async function POST(request: Request) {
  const stripe = getStripe();
  const auth = await requireAuth("COACH");
  if (auth.error) return auth.error;

  const body = await request.json();
  const tier = body.tier as "PRO" | "ELITE";

  if (!["PRO", "ELITE"].includes(tier)) {
    return NextResponse.json({ error: "Geçersiz plan." }, { status: 400 });
  }

  const priceId = STRIPE_PRICE_IDS[tier];
  if (!priceId) {
    return NextResponse.json({ error: "Plan yapılandırması eksik." }, { status: 500 });
  }

  let coachProfile = await prisma.coachProfile.findUnique({
    where: { userId: auth.session.user.id },
    select: { stripeCustomerId: true },
  });

  let customerId = coachProfile?.stripeCustomerId;

  if (!customerId) {
    const user = await prisma.user.findUnique({
      where: { id: auth.session.user.id },
      select: { email: true, name: true },
    });

    const customer = await stripe.customers.create({
      email: user!.email,
      name: user!.name,
      metadata: { userId: auth.session.user.id },
    });

    customerId = customer.id;

    await prisma.coachProfile.upsert({
      where: { userId: auth.session.user.id },
      update: { stripeCustomerId: customerId },
      create: {
        userId: auth.session.user.id,
        stripeCustomerId: customerId,
      },
    });
  }

  const origin = request.headers.get("origin") ?? process.env.NEXTAUTH_URL ?? "http://localhost:3000";

  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: "subscription",
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${origin}/coach/subscription?success=1`,
    cancel_url: `${origin}/coach/subscription?canceled=1`,
    metadata: { userId: auth.session.user.id, tier: PLAN_TO_TIER[tier] },
  });

  return NextResponse.json({ url: session.url });
}

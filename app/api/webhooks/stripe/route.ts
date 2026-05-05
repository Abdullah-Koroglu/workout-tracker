import { NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";
import { getTierFromStripePriceId } from "@/lib/billing-config";
import { SubscriptionTier } from "@prisma/client";

export async function POST(request: Request) {
  const stripe = getStripe();
  const body = await request.text();
  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  let event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    const userId = session.metadata?.userId;
    const tier = session.metadata?.tier as SubscriptionTier | undefined;
    const subscriptionId = typeof session.subscription === "string" ? session.subscription : null;

    if (userId && tier && subscriptionId) {
      await prisma.coachProfile.upsert({
        where: { userId },
        update: { subscriptionTier: tier, subscriptionStatus: "ACTIVE" },
        create: { userId, subscriptionTier: tier, subscriptionStatus: "ACTIVE" },
      });
    }
  }

  if (event.type === "customer.subscription.updated") {
    const sub = event.data.object;
    const priceId = sub.items.data[0]?.price.id;
    const tier = priceId ? getTierFromStripePriceId(priceId) : undefined;

    if (tier && typeof sub.customer === "string") {
      await prisma.coachProfile.updateMany({
        where: { stripeCustomerId: sub.customer },
        data: { subscriptionTier: tier, subscriptionStatus: sub.status.toUpperCase() },
      });
    }
  }

  if (event.type === "customer.subscription.deleted") {
    const sub = event.data.object;
    if (typeof sub.customer === "string") {
      await prisma.coachProfile.updateMany({
        where: { stripeCustomerId: sub.customer },
        data: { subscriptionTier: "FREE", subscriptionStatus: "CANCELED" },
      });
    }
  }

  return NextResponse.json({ received: true });
}

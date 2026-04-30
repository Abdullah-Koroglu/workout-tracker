import Stripe from "stripe";

let stripeInstance: Stripe | null = null;

export function getStripe(): Stripe {
  if (stripeInstance) return stripeInstance;

  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    throw new Error("STRIPE_SECRET_KEY env var is missing");
  }

  stripeInstance = new Stripe(secretKey, {
    apiVersion: "2026-04-22.dahlia",
  });

  return stripeInstance;
}

export const STRIPE_PRICE_IDS = {
  PRO: process.env.STRIPE_PRO_PRICE_ID!,
  ELITE: process.env.STRIPE_ELITE_PRICE_ID!,
} as const;

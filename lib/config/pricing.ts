import { SubscriptionTier } from "@prisma/client";

import { BILLING_PLANS } from "@/lib/billing-config";

export const TIER_LIMITS: Record<
  SubscriptionTier,
  { maxClients: number; price: number; name: string }
> = {
  FREE:   { maxClients: BILLING_PLANS.FREE.maxClients ?? 9999, price: BILLING_PLANS.FREE.price.monthly, name: BILLING_PLANS.FREE.label },
  TIER_1: { maxClients: BILLING_PLANS.TIER_1.maxClients ?? 9999, price: BILLING_PLANS.TIER_1.price.monthly, name: BILLING_PLANS.TIER_1.label },
  TIER_2: { maxClients: BILLING_PLANS.TIER_2.maxClients ?? 9999, price: BILLING_PLANS.TIER_2.price.monthly, name: BILLING_PLANS.TIER_2.label },
  AGENCY: { maxClients: BILLING_PLANS.AGENCY.maxClients ?? 9999, price: BILLING_PLANS.AGENCY.price.monthly, name: BILLING_PLANS.AGENCY.label },
};

export function canAcceptNewClient(
  currentClientCount: number,
  tier: SubscriptionTier
): boolean {
  return currentClientCount < TIER_LIMITS[tier].maxClients;
}

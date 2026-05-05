export { TIER_LIMITS, canAcceptNewClient } from "@/lib/config/pricing";
export type { } from "@/lib/config/pricing";

import { SubscriptionTier } from "@prisma/client";
import { BILLING_PLANS } from "@/lib/billing-config";
import { TIER_LIMITS } from "@/lib/config/pricing";

export const TIER_LABELS: Record<SubscriptionTier, string> = {
  FREE: BILLING_PLANS.FREE.label,
  TIER_1: BILLING_PLANS.TIER_1.label,
  TIER_2: BILLING_PLANS.TIER_2.label,
  AGENCY: BILLING_PLANS.AGENCY.label,
};

export const TIER_CLIENT_LIMITS: Record<SubscriptionTier, number> = {
  FREE:   3,
  TIER_1: 15,
  TIER_2: 50,
  AGENCY: 9999,
};

export function getMaxClients(tier: SubscriptionTier): number {
  return TIER_LIMITS[tier].maxClients;
}

export function canAcceptClient(tier: SubscriptionTier, currentClientCount: number): boolean {
  return currentClientCount < TIER_LIMITS[tier].maxClients;
}

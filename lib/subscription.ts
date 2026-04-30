export { TIER_LIMITS, canAcceptNewClient } from "@/lib/config/pricing";
export type { } from "@/lib/config/pricing";

import { SubscriptionTier } from "@prisma/client";
import { TIER_LIMITS } from "@/lib/config/pricing";

export const TIER_LABELS: Record<SubscriptionTier, string> = {
  FREE:   "Ücretsiz",
  TIER_1: "Pro",
  TIER_2: "Elite",
  AGENCY: "Agency",
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

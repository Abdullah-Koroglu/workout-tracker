import { SubscriptionTier } from "@prisma/client";

export const TIER_LIMITS: Record<
  SubscriptionTier,
  { maxClients: number; price: number; name: string }
> = {
  FREE:   { maxClients: 3,    price: 0,   name: "Starter" },
  TIER_1: { maxClients: 15,   price: 29,  name: "Pro" },
  TIER_2: { maxClients: 50,   price: 79,  name: "Elite" },
  AGENCY: { maxClients: 9999, price: 199, name: "Agency" },
};

export function canAcceptNewClient(
  currentClientCount: number,
  tier: SubscriptionTier
): boolean {
  return currentClientCount < TIER_LIMITS[tier].maxClients;
}

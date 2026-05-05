import type { SubscriptionTier } from "@prisma/client";

export type Feature = "analytics" | "bodyTracking" | "templates" | "clients";

export type TierConfig = {
  maxClients: number;
  maxTemplates: number; // Infinity = unlimited
  analytics: boolean;
  bodyTracking: boolean;
  label: string;
  color: string;
};

export const TIER_CONFIG: Record<SubscriptionTier, TierConfig> = {
  FREE: {
    maxClients: 3,
    maxTemplates: 8,
    analytics: true,
    bodyTracking: true,
    label: "Starter",
    color: "#64748B",
  },
  TIER_1: {
    maxClients: 15,
    maxTemplates: 20,
    analytics: true,
    bodyTracking: true,
    label: "Pro",
    color: "#3B82F6",
  },
  TIER_2: {
    maxClients: 50,
    maxTemplates: Infinity,
    analytics: true,
    bodyTracking: true,
    label: "Elite",
    color: "#F59E0B",
  },
  AGENCY: {
    maxClients: 9999,
    maxTemplates: Infinity,
    analytics: true,
    bodyTracking: true,
    label: "Agency",
    color: "#8B5CF6",
  },
};

export function isFeatureAllowed(tier: SubscriptionTier, feature: "analytics" | "bodyTracking"): boolean {
  return TIER_CONFIG[tier][feature];
}

export function isUnderLimit(tier: SubscriptionTier, feature: "templates" | "clients", current: number): boolean {
  const limit = feature === "templates"
    ? TIER_CONFIG[tier].maxTemplates
    : TIER_CONFIG[tier].maxClients;
  return current < limit;
}

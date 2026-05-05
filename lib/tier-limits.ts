import type { SubscriptionTier } from "@prisma/client";

import { BILLING_PLANS } from "@/lib/billing-config";

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
    maxClients: BILLING_PLANS.FREE.maxClients ?? 9999,
    maxTemplates: BILLING_PLANS.FREE.maxTemplates ?? Infinity,
    analytics: true,
    bodyTracking: true,
    label: BILLING_PLANS.FREE.label,
    color: "#64748B",
  },
  TIER_1: {
    maxClients: BILLING_PLANS.TIER_1.maxClients ?? 9999,
    maxTemplates: BILLING_PLANS.TIER_1.maxTemplates ?? Infinity,
    analytics: true,
    bodyTracking: true,
    label: BILLING_PLANS.TIER_1.label,
    color: "#3B82F6",
  },
  TIER_2: {
    maxClients: BILLING_PLANS.TIER_2.maxClients ?? 9999,
    maxTemplates: BILLING_PLANS.TIER_2.maxTemplates ?? Infinity,
    analytics: true,
    bodyTracking: true,
    label: BILLING_PLANS.TIER_2.label,
    color: "#F59E0B",
  },
  AGENCY: {
    maxClients: BILLING_PLANS.AGENCY.maxClients ?? 9999,
    maxTemplates: BILLING_PLANS.AGENCY.maxTemplates ?? Infinity,
    analytics: true,
    bodyTracking: true,
    label: BILLING_PLANS.AGENCY.label,
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

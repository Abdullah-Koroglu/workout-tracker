"use client";

import { useEffect, useState } from "react";
import type { SubscriptionTier } from "@prisma/client";
import { TIER_CONFIG } from "@/lib/tier-limits";

type TierLimits = {
  maxTemplates: number | null; // null = unlimited
  maxClients: number;
  analytics: boolean;
  bodyTracking: boolean;
};

type TierAccessState = {
  loading: boolean;
  tier: SubscriptionTier | null;
  templateCount: number;
  clientCount: number;
  limits: TierLimits | null;
  canAddTemplate: boolean;
  canAddClient: boolean;
};

const DEFAULT_STATE: TierAccessState = {
  loading: true,
  tier: null,
  templateCount: 0,
  clientCount: 0,
  limits: null,
  canAddTemplate: false,
  canAddClient: false,
};

export function useTierAccess(): TierAccessState {
  const [state, setState] = useState<TierAccessState>(DEFAULT_STATE);

  useEffect(() => {
    fetch("/api/coach/access")
      .then((r) => r.json())
      .then((data) => {
        setState({
          loading: false,
          tier: data.tier,
          templateCount: data.templateCount,
          clientCount: data.clientCount,
          limits: data.limits,
          canAddTemplate: data.canAddTemplate,
          canAddClient: data.canAddClient,
        });
      })
      .catch(() => setState((p) => ({ ...p, loading: false })));
  }, []);

  return state;
}

/** Convenience: check feature access from a known tier (no fetch) */
export function tierHasFeature(tier: SubscriptionTier | null, feature: "analytics" | "bodyTracking"): boolean {
  if (!tier) return false;
  return TIER_CONFIG[tier][feature];
}

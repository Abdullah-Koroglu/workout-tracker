import { NextResponse } from "next/server";
import type { SubscriptionTier } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { resolveCoachSubscription } from "@/lib/payment-service";
import { TIER_CONFIG, type Feature } from "@/lib/tier-limits";

export type AccessResult =
  | { allowed: true; tier: SubscriptionTier }
  | { allowed: false; tier: SubscriptionTier; reason: string };

export async function getCoachTier(coachId: string): Promise<SubscriptionTier> {
  const resolved = await resolveCoachSubscription(coachId);
  return resolved.tier;
}

export async function checkFeatureAccess(coachId: string, feature: Feature): Promise<AccessResult> {
  const tier = await getCoachTier(coachId);
  const cfg = TIER_CONFIG[tier];

  if (feature === "analytics" && !cfg.analytics) {
    return { allowed: false, tier, reason: "Analitik özelliği Pro ve üzeri planlarda kullanılabilir." };
  }

  if (feature === "bodyTracking" && !cfg.bodyTracking) {
    return { allowed: false, tier, reason: "Vücut takibi Pro ve üzeri planlarda kullanılabilir." };
  }

  if (feature === "templates") {
    const count = await prisma.workoutTemplate.count({ where: { coachId } });
    if (count >= cfg.maxTemplates) {
      return {
        allowed: false,
        tier,
        reason: `Şablon limitine ulaştınız (${cfg.maxTemplates} / ${cfg.maxTemplates}). Planınızı yükseltin.`,
      };
    }
  }

  if (feature === "clients") {
    const count = await prisma.coachClientRelation.count({ where: { coachId, status: "ACCEPTED" } });
    if (count >= cfg.maxClients) {
      return {
        allowed: false,
        tier,
        reason: `Danışan limitine ulaştınız (${cfg.maxClients} / ${cfg.maxClients}). Planınızı yükseltin.`,
      };
    }
  }

  return { allowed: true, tier };
}

/** Call this to return a standardized 403 from an API route */
export function tierAccessDenied(reason: string, tier: SubscriptionTier) {
  return NextResponse.json({ error: reason, upgradeRequired: true, tier }, { status: 403 });
}

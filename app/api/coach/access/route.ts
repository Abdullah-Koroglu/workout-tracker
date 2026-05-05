import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import { resolveCoachSubscription } from "@/lib/payment-service";
import { TIER_CONFIG } from "@/lib/tier-limits";

export async function GET() {
  const auth = await requireAuth("COACH");
  if (auth.error) return auth.error;

  const coachId = auth.session.user.id;

  const [resolved, templateCount, clientCount] = await Promise.all([
    resolveCoachSubscription(coachId),
    prisma.workoutTemplate.count({ where: { coachId } }),
    prisma.coachClientRelation.count({ where: { coachId, status: "ACCEPTED" } }),
  ]);

  const tier = resolved.tier;
  const cfg = TIER_CONFIG[tier];

  return NextResponse.json({
    tier,
    templateCount,
    clientCount,
    limits: {
      maxTemplates: cfg.maxTemplates === Infinity ? null : cfg.maxTemplates,
      maxClients: cfg.maxClients,
      analytics: cfg.analytics,
      bodyTracking: cfg.bodyTracking,
    },
    canAddTemplate: templateCount < cfg.maxTemplates,
    canAddClient: clientCount < cfg.maxClients,
  });
}

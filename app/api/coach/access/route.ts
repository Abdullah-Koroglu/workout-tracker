import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import { TIER_CONFIG } from "@/lib/tier-limits";

export async function GET() {
  const auth = await requireAuth("COACH");
  if (auth.error) return auth.error;

  const coachId = auth.session.user.id;

  const [profile, templateCount, clientCount] = await Promise.all([
    prisma.coachProfile.findUnique({
      where: { userId: coachId },
      select: { subscriptionTier: true },
    }),
    prisma.workoutTemplate.count({ where: { coachId } }),
    prisma.coachClientRelation.count({ where: { coachId, status: "ACCEPTED" } }),
  ]);

  const tier = profile?.subscriptionTier ?? "FREE";
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

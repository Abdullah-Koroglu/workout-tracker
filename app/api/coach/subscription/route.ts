import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import { TIER_CLIENT_LIMITS, TIER_LABELS } from "@/lib/subscription";

export async function GET() {
  const auth = await requireAuth("COACH");
  if (auth.error) return auth.error;

  const profile = await prisma.coachProfile.findUnique({
    where: { userId: auth.session.user.id },
    select: { subscriptionTier: true },
  });

  const tier = profile?.subscriptionTier ?? "FREE";
  const currentClientCount = await prisma.coachClientRelation.count({
    where: { coachId: auth.session.user.id, status: "ACCEPTED" },
  });

  return NextResponse.json({
    tier,
    label: TIER_LABELS[tier],
    maxClients: TIER_CLIENT_LIMITS[tier] === Infinity ? null : TIER_CLIENT_LIMITS[tier],
    currentClientCount,
  });
}

import { NextResponse } from "next/server";

import { requireAuth } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import { calculateComplianceScore } from "@/lib/analytics/compliance";
import { checkFeatureAccess, tierAccessDenied } from "@/lib/feature-access";
import { canAcceptNewClient, TIER_LIMITS } from "@/lib/config/pricing";
import { resolveCoachSubscription } from "@/lib/payment-service";
import { TIER_LABELS } from "@/lib/subscription";
import { z } from "zod";

const coachClientCreateSchema = z.object({
  clientId: z.string().min(1),
});

export async function GET() {
  const auth = await requireAuth("COACH");
  if (auth.error) return auth.error;

  const relations = await prisma.coachClientRelation.findMany({
    where: { coachId: auth.session.user.id },
    include: { client: true },
    orderBy: { createdAt: "desc" }
  });

  const accepted = await Promise.all(
    relations
      .filter((r) => r.status === "ACCEPTED")
      .map(async (r) => ({
        id: r.client.id,
        relationId: r.id,
        name: r.client.name,
        email: r.client.email,
        status: r.status,
        complianceScore: await calculateComplianceScore(r.client.id),
      }))
  );

  const pending = relations
    .filter((r) => r.status === "PENDING")
    .map((r) => ({
      id: r.client.id,
      relationId: r.id,
      name: r.client.name,
      email: r.client.email,
      status: r.status,
    }));

  return NextResponse.json({ clients: accepted, accepted, pending });
}

export async function POST(request: Request) {
  try {
    const auth = await requireAuth("COACH");
    if (auth.error) return auth.error;

    const access = await checkFeatureAccess(auth.session.user.id, "clients");
    if (!access.allowed) return tierAccessDenied(access.reason, access.tier);

    const body = await request.json().catch(() => ({}));
    const parsed = coachClientCreateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const clientId = parsed.data.clientId;
    const currentCount = await prisma.coachClientRelation.count({
      where: { coachId: auth.session.user.id, status: "ACCEPTED" },
    });
    const resolvedSubscription = await resolveCoachSubscription(auth.session.user.id);

    if (!canAcceptNewClient(currentCount, resolvedSubscription.tier)) {
      const limit = TIER_LIMITS[resolvedSubscription.tier].maxClients;
      return NextResponse.json(
        {
          error: `${TIER_LABELS[resolvedSubscription.tier]} planında maksimum ${limit} danışan kabul edebilirsin. Daha fazlası için planını yükselt.`,
          code: "LIMIT_REACHED",
          tier: resolvedSubscription.tier,
          limit,
          provider: resolvedSubscription.provider,
        },
        { status: 403 },
      );
    }

    const relation = await prisma.coachClientRelation.upsert({
      where: { coachId_clientId: { coachId: auth.session.user.id, clientId } },
      update: { status: "ACCEPTED" },
      create: {
        coachId: auth.session.user.id,
        clientId,
        status: "ACCEPTED",
      },
    });

    return NextResponse.json({ relation });
  } catch (error) {
    console.error("[api/coach/clients] Failed to accept client", error);
    return NextResponse.json({ error: "Danışan eklenemedi." }, { status: 500 });
  }
}

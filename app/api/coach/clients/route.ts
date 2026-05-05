import { NextResponse } from "next/server";

import { requireAuth } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import { calculateComplianceScore } from "@/lib/analytics/compliance";
import { checkFeatureAccess, tierAccessDenied } from "@/lib/feature-access";

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
  const auth = await requireAuth("COACH");
  if (auth.error) return auth.error;

  const access = await checkFeatureAccess(auth.session.user.id, "clients");
  if (!access.allowed) return tierAccessDenied(access.reason, access.tier);

  const body = await request.json();
  const clientId = String(body.clientId || "");

  const relation = await prisma.coachClientRelation.upsert({
    where: { coachId_clientId: { coachId: auth.session.user.id, clientId } },
    update: { status: "ACCEPTED" },
    create: {
      coachId: auth.session.user.id,
      clientId,
      status: "ACCEPTED"
    }
  });

  return NextResponse.json({ relation });
}

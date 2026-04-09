import { NextResponse } from "next/server";

import { requireAuth } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const auth = await requireAuth("COACH");
  if (auth.error) return auth.error;

  const relations = await prisma.coachClientRelation.findMany({
    where: { coachId: auth.session.user.id },
    include: { client: true },
    orderBy: { createdAt: "desc" }
  });

  const accepted = relations
    .filter((relation) => relation.status === "ACCEPTED")
    .map((relation) => ({
      id: relation.client.id,
      relationId: relation.id,
      name: relation.client.name,
      email: relation.client.email,
      status: relation.status
    }));
  const pending = relations
    .filter((relation) => relation.status === "PENDING")
    .map((relation) => ({
      id: relation.client.id,
      relationId: relation.id,
      name: relation.client.name,
      email: relation.client.email,
      status: relation.status
    }));

  return NextResponse.json({
    clients: accepted,
    accepted,
    pending
  });
}

export async function POST(request: Request) {
  const auth = await requireAuth("COACH");
  if (auth.error) return auth.error;

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

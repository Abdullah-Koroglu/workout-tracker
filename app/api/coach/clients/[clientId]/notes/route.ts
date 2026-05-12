import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAuth } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";

const updateSchema = z.object({
  notes: z.string().max(5000),
  tags: z.array(z.string().max(50)).max(20).optional().default([]),
});

// GET /api/coach/clients/[clientId]/notes
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ clientId: string }> }
) {
  const auth = await requireAuth("COACH");
  if ("error" in auth) return auth.error;

  const { clientId } = await params;

  const relation = await prisma.coachClientRelation.findFirst({
    where: { coachId: auth.session.user.id, clientId, status: "ACCEPTED" },
    include: { notes: true },
  });

  if (!relation) {
    return NextResponse.json({ error: "Relation not found" }, { status: 404 });
  }

  return NextResponse.json({
    notes: relation.notes?.notes ?? "",
    tags: JSON.parse(relation.notes?.tags ?? "[]") as string[],
  });
}

// PUT /api/coach/clients/[clientId]/notes
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ clientId: string }> }
) {
  const auth = await requireAuth("COACH");
  if ("error" in auth) return auth.error;

  const { clientId } = await params;
  const body = await request.json();
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const relation = await prisma.coachClientRelation.findFirst({
    where: { coachId: auth.session.user.id, clientId },
  });

  if (!relation) {
    return NextResponse.json({ error: "Relation not found" }, { status: 404 });
  }

  await prisma.clientNotes.upsert({
    where: { relationId: relation.id },
    create: {
      relationId: relation.id,
      notes: parsed.data.notes,
      tags: JSON.stringify(parsed.data.tags),
    },
    update: {
      notes: parsed.data.notes,
      tags: JSON.stringify(parsed.data.tags),
    },
  });

  return NextResponse.json({ ok: true });
}

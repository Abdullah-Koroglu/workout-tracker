import { RelationStatus } from "@prisma/client";
import { NextResponse } from "next/server";

import { requireAuth } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ clientId: string }> }
) {
  const auth = await requireAuth("COACH");
  if (auth.error) return auth.error;

  const { clientId } = await params;
  const body = await request.json();
  const status = body.status as RelationStatus;

  if (!["ACCEPTED", "REJECTED"].includes(status)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  const relation = await prisma.coachClientRelation.upsert({
    where: { coachId_clientId: { coachId: auth.session.user.id, clientId } },
    update: { status },
    create: {
      coachId: auth.session.user.id,
      clientId,
      status
    }
  });

  return NextResponse.json({ relation });
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ clientId: string }> }
) {
  const auth = await requireAuth("COACH");
  if (auth.error) return auth.error;

  const { clientId } = await params;

  const relation = await prisma.coachClientRelation.findUnique({
    where: { coachId_clientId: { coachId: auth.session.user.id, clientId } }
  });

  if (!relation) {
    return NextResponse.json({ error: "İlişki bulunamadı." }, { status: 404 });
  }

  await prisma.templateAssignment.deleteMany({
    where: {
      clientId,
      template: {
        coachId: auth.session.user.id
      },
      workouts: {
        none: {}
      }
    }
  });

  await prisma.coachClientRelation.delete({
    where: { coachId_clientId: { coachId: auth.session.user.id, clientId } }
  });

  return NextResponse.json({ success: true });
}

export async function POST(request: Request, context: { params: Promise<{ clientId: string }> }) {
  return PATCH(request, context);
}

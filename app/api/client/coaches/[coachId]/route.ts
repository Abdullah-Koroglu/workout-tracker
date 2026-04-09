import { NextResponse } from "next/server";

import { requireAuth } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ coachId: string }> }
) {
  const auth = await requireAuth("CLIENT");
  if (auth.error) return auth.error;

  const { coachId } = await params;
  const clientId = auth.session.user.id;

  const relation = await prisma.coachClientRelation.findUnique({
    where: { coachId_clientId: { coachId, clientId } }
  });

  if (!relation) {
    return NextResponse.json({ error: "İlişki bulunamadı." }, { status: 404 });
  }

  await prisma.templateAssignment.deleteMany({
    where: {
      clientId,
      template: {
        coachId
      },
      workouts: {
        none: {}
      }
    }
  });

  await prisma.coachClientRelation.delete({
    where: { coachId_clientId: { coachId, clientId } }
  });

  return NextResponse.json({ success: true });
}

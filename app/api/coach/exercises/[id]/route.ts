import { NextResponse } from "next/server";

import { requireAuth } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth("COACH");
  if (auth.error) return auth.error;

  const { id } = await params;

  const linkedTemplateCount = await prisma.workoutTemplateExercise.count({
    where: {
      exerciseId: id,
      template: {
        coachId: auth.session.user.id
      }
    }
  });

  if (linkedTemplateCount > 0) {
    return NextResponse.json(
      { error: "Bu egzersiz aktif template'lerde kullanılıyor." },
      { status: 409 }
    );
  }

  await prisma.exercise.delete({ where: { id } });

  return NextResponse.json({ ok: true });
}

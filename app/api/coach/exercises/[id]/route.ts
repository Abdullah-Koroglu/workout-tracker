import { NextResponse } from "next/server";
import { z } from "zod";

import { requireAuth } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import { MUSCLE_GROUPS } from "@/validations/exercise";

const patchSchema = z.object({
  name: z.string().min(2).optional(),
  targetMuscle: z.enum(MUSCLE_GROUPS).nullable().optional(),
});

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth("COACH");
  if (auth.error) return auth.error;

  const { id } = await params;
  const body = await request.json().catch(() => ({}));
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const exercise = await prisma.exercise.update({
    where: { id },
    data: parsed.data,
  });
  return NextResponse.json({ exercise });
}

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

import { NextResponse } from "next/server";
import { z } from "zod";

import { requireAuth } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import { MUSCLE_GROUPS } from "@/validations/exercise";

const patchSchema = z.object({
  name: z.string().min(2).optional(),
  targetMuscle: z.enum(MUSCLE_GROUPS).nullable().optional(),
});

async function ensureCoachCanManageExercise(coachId: string, exerciseId: string) {
  const [exercise, coachUsageCount, otherCoachUsageCount] = await Promise.all([
    prisma.exercise.findUnique({ where: { id: exerciseId }, select: { id: true } }),
    prisma.workoutTemplateExercise.count({
      where: {
        exerciseId,
        template: { coachId },
      },
    }),
    prisma.workoutTemplateExercise.count({
      where: {
        exerciseId,
        template: { coachId: { not: coachId } },
      },
    }),
  ]);

  if (!exercise) {
    return { ok: false as const, response: NextResponse.json({ error: "Egzersiz bulunamadı." }, { status: 404 }) };
  }

  if (otherCoachUsageCount > 0) {
    return {
      ok: false as const,
      response: NextResponse.json({ error: "Bu egzersiz başka koçların şablonlarında da kullanılıyor." }, { status: 403 }),
    };
  }

  if (coachUsageCount === 0) {
    return {
      ok: false as const,
      response: NextResponse.json({ error: "Bu egzersiz üzerinde işlem yapmak için koç kullanım kaydı bulunamadı." }, { status: 403 }),
    };
  }

  return { ok: true as const };
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAuth("COACH");
    if (auth.error) return auth.error;

    const { id } = await params;
    const body = await request.json().catch(() => ({}));
    const parsed = patchSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

    const access = await ensureCoachCanManageExercise(auth.session.user.id, id);
    if (!access.ok) return access.response;

    const exercise = await prisma.exercise.update({
      where: { id },
      data: parsed.data,
    });
    return NextResponse.json({ exercise });
  } catch (error) {
    console.error("[api/coach/exercises] Failed to update exercise", error);
    return NextResponse.json({ error: "Egzersiz güncellenemedi." }, { status: 500 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAuth("COACH");
    if (auth.error) return auth.error;

    const { id } = await params;
    const access = await ensureCoachCanManageExercise(auth.session.user.id, id);
    if (!access.ok) return access.response;

    const linkedTemplateCount = await prisma.workoutTemplateExercise.count({
      where: {
        exerciseId: id,
        template: {
          coachId: auth.session.user.id,
        },
      },
    });

    if (linkedTemplateCount > 0) {
      return NextResponse.json(
        { error: "Bu egzersiz aktif template'lerde kullanılıyor." },
        { status: 409 },
      );
    }

    await prisma.exercise.delete({ where: { id } });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[api/coach/exercises] Failed to delete exercise", error);
    return NextResponse.json({ error: "Egzersiz silinemedi." }, { status: 500 });
  }
}

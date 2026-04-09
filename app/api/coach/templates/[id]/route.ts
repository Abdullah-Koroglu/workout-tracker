import { NextResponse } from "next/server";

import { requireAuth } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import { templateSchema } from "@/validations/template";

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAuth("COACH");
  if (auth.error) return auth.error;

  const { id } = await params;
  const body = await request.json();
  const parsed = templateSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const existingTemplate = await prisma.workoutTemplate.findFirst({
    where: {
      id,
      coachId: auth.session.user.id
    },
    select: {
      id: true
    }
  });

  if (!existingTemplate) {
    return NextResponse.json({ error: "Template bulunamadı." }, { status: 404 });
  }

  const template = await prisma.workoutTemplate.update({
    where: { id },
    data: {
      name: parsed.data.name,
      description: parsed.data.description,
      exercises: {
        deleteMany: {},
        create: parsed.data.exercises.map((e) => ({
          exerciseId: e.exerciseId,
          order: e.order,
          targetSets: e.exerciseType === "WEIGHT" ? e.targetSets ?? null : null,
          targetReps: e.exerciseType === "WEIGHT" ? e.targetReps ?? null : null,
          targetRir: e.exerciseType === "WEIGHT" ? e.targetRir ?? null : null,
          durationMinutes: e.exerciseType === "CARDIO" ? e.durationMinutes ?? null : null,
          protocol: e.exerciseType === "CARDIO" ? e.protocol ?? undefined : undefined
        }))
      }
    }
  });

  return NextResponse.json({ template });
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAuth("COACH");
  if (auth.error) return auth.error;

  const { id } = await params;
  const template = await prisma.workoutTemplate.findFirst({
    where: {
      id,
      coachId: auth.session.user.id
    },
    select: {
      id: true
    }
  });

  if (!template) {
    return NextResponse.json({ error: "Template bulunamadı." }, { status: 404 });
  }

  await prisma.workoutTemplate.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}

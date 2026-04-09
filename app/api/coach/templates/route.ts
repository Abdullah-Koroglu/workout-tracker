import { NextResponse } from "next/server";

import { requireAuth } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import { templateSchema } from "@/validations/template";

export async function GET() {
  const auth = await requireAuth("COACH");
  if (auth.error) return auth.error;

  const templates = await prisma.workoutTemplate.findMany({
    where: { coachId: auth.session.user.id },
    include: { exercises: { include: { exercise: true }, orderBy: { order: "asc" } } },
    orderBy: { createdAt: "desc" }
  });

  return NextResponse.json({ templates });
}

export async function POST(request: Request) {
  const auth = await requireAuth("COACH");
  if (auth.error) return auth.error;

  const body = await request.json();
  const parsed = templateSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const template = await prisma.workoutTemplate.create({
    data: {
      coachId: auth.session.user.id,
      name: parsed.data.name,
      description: parsed.data.description,
      exercises: {
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
    },
    include: { exercises: true }
  });

  return NextResponse.json({ template }, { status: 201 });
}

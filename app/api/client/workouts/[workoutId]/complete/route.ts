import { NextResponse } from "next/server";

import { requireAuth } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import { completeWorkoutSchema } from "@/validations/workout";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ workoutId: string }> }
) {
  const auth = await requireAuth("CLIENT");
  if (auth.error) return auth.error;

  const { workoutId } = await params;
  const workout = await prisma.workout.findUnique({ where: { id: workoutId } });

  if (!workout || workout.clientId !== auth.session.user.id) {
    return NextResponse.json({ error: "Workout not found" }, { status: 404 });
  }

  const body = await request.json().catch(() => ({}));
  const parsed = completeWorkoutSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const intensityScore =
    typeof body.intensityScore === "number" &&
    body.intensityScore >= 1 &&
    body.intensityScore <= 10
      ? Math.round(body.intensityScore)
      : null;

  const updated = await prisma.workout.update({
    where: { id: workoutId },
    data: {
      status: parsed.data.mode,
      finishedAt: new Date(),
      ...(intensityScore !== null ? { intensityScore } : {}),
    },
  });

  return NextResponse.json({ workout: updated });
}

import { NextResponse } from "next/server";

import { requireAuth } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";

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
  const score = typeof body.intensityScore === "number" ? Math.round(body.intensityScore) : null;

  if (score === null || score < 1 || score > 10) {
    return NextResponse.json({ error: "Geçersiz yoğunluk skoru (1-10 arası olmalı)." }, { status: 400 });
  }

  const updated = await prisma.workout.update({
    where: { id: workoutId },
    data: { intensityScore: score },
  });

  return NextResponse.json({ workout: updated });
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ workoutId: string }> }
) {
  const auth = await requireAuth("CLIENT");
  if (auth.error) return auth.error;

  const { workoutId } = await params;
  const workout = await prisma.workout.findUnique({
    where: { id: workoutId },
    include: {
      template: true,
      sets: { include: { exercise: true }, orderBy: [{ exerciseId: "asc" }, { setNumber: "asc" }] },
      comments: { include: { author: true }, orderBy: { createdAt: "desc" } }
    }
  });

  if (!workout || workout.clientId !== auth.session.user.id) {
    return NextResponse.json({ error: "Workout not found" }, { status: 404 });
  }

  return NextResponse.json({ workout });
}

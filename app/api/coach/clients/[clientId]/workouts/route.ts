import { NextResponse } from "next/server";

import { requireAuth } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ clientId: string }> }
) {
  const auth = await requireAuth("COACH");
  if (auth.error) return auth.error;

  const { clientId } = await params;

  const relation = await prisma.coachClientRelation.findFirst({
    where: {
      coachId: auth.session.user.id,
      clientId,
      status: "ACCEPTED"
    }
  });

  if (!relation) {
    return NextResponse.json({ error: "Client relation not found" }, { status: 404 });
  }

  const workouts = await prisma.workout.findMany({
    where: { clientId },
    include: {
      template: true,
      sets: { include: { exercise: true }, orderBy: [{ exerciseId: "asc" }, { setNumber: "asc" }] },
      comments: { include: { author: true }, orderBy: { createdAt: "asc" } }
    },
    orderBy: { startedAt: "desc" }
  });

  const enrichedWorkouts = workouts.map((w) => ({
    ...w,
    durationMinutes: w.finishedAt
      ? Math.round((w.finishedAt.getTime() - w.startedAt.getTime()) / 60000)
      : null
  }));

  return NextResponse.json({ workouts: enrichedWorkouts });
}

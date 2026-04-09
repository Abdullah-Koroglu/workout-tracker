import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ workoutId: string }> }
) {
  const auth = await requireAuth("COACH");
  if (auth.error) return auth.error;

  const { workoutId } = await params;

  const workout = await prisma.workout.findUnique({
    where: { id: workoutId },
    include: {
      client: { select: { id: true, name: true, email: true } },
      template: { select: { id: true, name: true } },
      sets: { include: { exercise: true }, orderBy: { setNumber: "asc" } },
      assignment: { select: { id: true, isOneTime: true, scheduledFor: true } }
    }
  });

  if (!workout) {
    return NextResponse.json({ error: "Workout not found" }, { status: 404 });
  }

  const relation = await prisma.coachClientRelation.findUnique({
    where: {
      coachId_clientId: {
        coachId: auth.session.user.id,
        clientId: workout.clientId
      }
    }
  });

  if (!relation || relation.status !== "ACCEPTED") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const durationMinutes = workout.finishedAt
    ? Math.round((workout.finishedAt.getTime() - workout.startedAt.getTime()) / 60000)
    : null;

  return NextResponse.json({
    id: workout.id,
    status: workout.status,
    client: workout.client,
    template: workout.template,
    assignment: workout.assignment,
    startedAt: workout.startedAt,
    finishedAt: workout.finishedAt,
    durationMinutes,
    sets: workout.sets
  });
}
import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth("CLIENT");
  if (auth.error) return auth.error;

  const { id: assignmentId } = await params;

  const assignment = await prisma.templateAssignment.findUnique({
    where: { id: assignmentId },
    include: {
      template: {
        include: {
          exercises: {
            include: { exercise: true },
            orderBy: { order: "asc" }
          }
        }
      }
    }
  });

  if (!assignment || assignment.clientId !== auth.session.user.id) {
    return NextResponse.json({ error: "Assignment not found" }, { status: 404 });
  }

  const inProgressWorkout = await prisma.workout.findFirst({
    where: {
      assignmentId: assignment.id,
      clientId: auth.session.user.id,
      status: "IN_PROGRESS"
    },
    orderBy: { startedAt: "desc" },
    select: {
      id: true,
      status: true,
      startedAt: true,
      finishedAt: true
    }
  });

  const consumedWorkout = assignment.isOneTime
    ? await prisma.workout.findFirst({
        where: {
          assignmentId: assignment.id,
          clientId: auth.session.user.id,
          status: { in: ["COMPLETED", "ABANDONED"] }
        },
        orderBy: { startedAt: "desc" },
        select: {
          id: true,
          status: true,
          startedAt: true,
          finishedAt: true
        }
      })
    : null;

  return NextResponse.json({
    id: assignment.id,
    templateName: assignment.template.name,
    isOneTime: assignment.isOneTime,
    blockingWorkout: inProgressWorkout || consumedWorkout,
    exercises: assignment.template.exercises.map((te) => ({
      id: te.exercise.id,
      name: te.exercise.name,
      type: te.exercise.type
    }))
  });
}

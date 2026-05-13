import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const auth = await requireAuth("CLIENT");
  if ("error" in auth) return auth.error;

  const workout = await prisma.workout.findFirst({
    where: { clientId: auth.session.user.id, status: "IN_PROGRESS" },
    select: {
      id: true,
      assignmentId: true,
      startedAt: true,
      template: { select: { name: true } },
    },
    orderBy: { startedAt: "desc" },
  });

  if (!workout) return NextResponse.json({ workout: null });

  return NextResponse.json({
    workout: {
      workoutId: workout.id,
      assignmentId: workout.assignmentId,
      templateName: workout.template.name,
      startedAt: workout.startedAt.toISOString(),
    },
  });
}

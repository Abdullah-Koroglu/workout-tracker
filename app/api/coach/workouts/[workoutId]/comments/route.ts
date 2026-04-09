import { NextResponse } from "next/server";

import { requireAuth } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import { commentSchema } from "@/validations/workout";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ workoutId: string }> }
) {
  const auth = await requireAuth("COACH");
  if (auth.error) return auth.error;

  const { workoutId } = await params;
  const body = await request.json();
  const parsed = commentSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const workout = await prisma.workout.findUnique({
    where: { id: workoutId },
    select: { clientId: true }
  });

  if (!workout) {
    return NextResponse.json({ error: "Workout not found" }, { status: 404 });
  }

  const relation = await prisma.coachClientRelation.findFirst({
    where: {
      coachId: auth.session.user.id,
      clientId: workout.clientId,
      status: "ACCEPTED"
    }
  });

  if (!relation) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const comment = await prisma.comment.create({
    data: {
      workoutId,
      authorId: auth.session.user.id,
      content: parsed.data.content
    }
  });

  return NextResponse.json({ comment }, { status: 201 });
}

import { NextResponse } from "next/server";

import { requireAuth } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import { notify } from "@/lib/notify";
import { commentSchema } from "@/validations/workout";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ workoutId: string }> }
) {
  try {
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
      select: { id: true, clientId: true },
    });

    if (!workout) {
      return NextResponse.json({ error: "Workout not found" }, { status: 404 });
    }

    const relation = await prisma.coachClientRelation.findFirst({
      where: {
        coachId: auth.session.user.id,
        clientId: workout.clientId,
        status: "ACCEPTED",
      },
    });

    if (!relation) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const comment = await prisma.comment.create({
      data: {
        workoutId,
        authorId: auth.session.user.id,
        content: parsed.data.content,
      },
    });

    const coachName = auth.session.user.name ?? "Koçun";
    await notify({
      userId: workout.clientId,
      title: `${coachName} antrenmanına yorum bıraktı`,
      body: parsed.data.content.slice(0, 140),
      type: "WORKOUT_COMMENT",
      actionUrl: `/client/workouts/${workoutId}`,
    });

    return NextResponse.json({ comment }, { status: 201 });
  } catch (error) {
    console.error("[api/coach/workouts/comments] Failed to create comment", error);
    return NextResponse.json({ error: "Yorum eklenemedi." }, { status: 500 });
  }
}

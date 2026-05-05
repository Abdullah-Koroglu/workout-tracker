import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";

import { requireAuth } from "@/lib/api-auth";
import { sendPushNotification } from "@/lib/push-notifications";
import { prisma } from "@/lib/prisma";
import { emitNotificationViaWs, notifPayload } from "@/lib/notify-ws";
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
      select: {
        id: true,
        clientId: true,
        client: {
          select: {
            pushSubscription: true,
          },
        },
      },
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
    const notif = await prisma.notification.create({
      data: {
        userId: workout.clientId,
        title: `${coachName} antrenmanına yorum bıraktı`,
        body: parsed.data.content.slice(0, 140),
        type: "WORKOUT_COMMENT",
      },
    });
    void emitNotificationViaWs(workout.clientId, notifPayload(notif));

    const pushResult = await sendPushNotification(workout.client.pushSubscription, {
      title: "Coach yeni bir yorum birakti",
      body: parsed.data.content.slice(0, 140),
      url: `/client/workouts/${workoutId}`,
    });

    if (pushResult.expired) {
      await prisma.user.update({
        where: { id: workout.clientId },
        data: { pushSubscription: Prisma.DbNull },
      });
    }

    return NextResponse.json({ comment }, { status: 201 });
  } catch (error) {
    console.error("[api/coach/workouts/comments] Failed to create comment", error);
    return NextResponse.json({ error: "Yorum eklenemedi." }, { status: 500 });
  }
}

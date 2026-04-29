import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";

import { requireAuth } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import { emitNotificationViaWs, notifPayload } from "@/lib/notify-ws";
import { sendPushNotification } from "@/lib/push-notifications";
import { completeWorkoutSchema } from "@/validations/workout";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ workoutId: string }> }
) {
  const auth = await requireAuth("CLIENT");
  if (auth.error) return auth.error;

  const { workoutId } = await params;
  const workout = await prisma.workout.findUnique({
    where: { id: workoutId },
    include: {
      template: { select: { name: true, coachId: true } },
    },
  });

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

  // Notify coach if workout was completed (not abandoned)
  if (parsed.data.mode === "COMPLETED") {
    const clientName = auth.session.user.name ?? "Danışanın";
    const coachId = workout.template.coachId;
    const notif = await prisma.notification.create({
      data: {
        userId: coachId,
        title: "Antrenman tamamlandı",
        body: `${clientName} "${workout.template.name}" programını tamamladı.`,
        type: "WORKOUT_COMPLETED",
      },
    });
    void emitNotificationViaWs(coachId, notifPayload(notif));

    const coach = await prisma.user.findUnique({
      where: { id: coachId },
      select: { pushSubscription: true }
    });

    const pushResult = await sendPushNotification(coach?.pushSubscription, {
      title: notif.title,
      body: notif.body,
      url: "/coach/dashboard"
    });

    if (pushResult.expired) {
      await prisma.user.update({
        where: { id: coachId },
        data: { pushSubscription: Prisma.DbNull }
      });
    }
  }

  return NextResponse.json({ workout: updated });
}

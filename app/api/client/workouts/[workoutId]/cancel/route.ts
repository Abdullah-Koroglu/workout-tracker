import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { requireAuth } from "@/lib/api-auth";
import { emitNotificationViaWs, notifPayload } from "@/lib/notify-ws";
import { prisma } from "@/lib/prisma";
import { sendPushNotification } from "@/lib/push-notifications";

export async function POST(
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

  if (!workout) {
    return NextResponse.json({ error: "Antrenman bulunamadı" }, { status: 404 });
  }

  if (workout.clientId !== auth.session.user.id) {
    return NextResponse.json({ error: "Bu antrenmanı iptal etmeye yetkilisi değilsin" }, { status: 403 });
  }

  if (workout.status !== "IN_PROGRESS") {
    return NextResponse.json(
      { error: "Sadece devam etmekte olan antrenmanlar iptal edilebilir" },
      { status: 400 }
    );
  }

  const updated = await prisma.workout.update({
    where: { id: workoutId },
    data: {
      status: "ABANDONED",
      finishedAt: new Date(),
    },
  });

  const clientName = auth.session.user.name ?? "Danışanın";
  const coachId = workout.template.coachId;
  const notif = await prisma.notification.create({
    data: {
      userId: coachId,
      title: "Antrenman yarıda bırakıldı",
      body: `${clientName} "${workout.template.name}" antrenmanını yarıda bıraktı.`,
      type: "WORKOUT_ABANDONED",
    },
  });
  void emitNotificationViaWs(coachId, notifPayload(notif));

  const coach = await prisma.user.findUnique({
    where: { id: coachId },
    select: { pushSubscription: true },
  });

  const pushResult = await sendPushNotification(coach?.pushSubscription, {
    title: notif.title,
    body: notif.body,
    url: "/coach/dashboard",
  });

  if (pushResult.expired) {
    await prisma.user.update({
      where: { id: coachId },
      data: { pushSubscription: Prisma.DbNull },
    });
  }

  return NextResponse.json({
    success: true,
    abandonedWorkoutId: workoutId,
    workout: updated,
  });
}
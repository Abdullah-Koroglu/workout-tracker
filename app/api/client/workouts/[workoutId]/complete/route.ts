import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";

import { requireAuth } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import { emitNotificationViaWs, notifPayload } from "@/lib/notify-ws";
import { sendPushNotification } from "@/lib/push-notifications";
import { completeWorkoutSchema } from "@/validations/workout";
import { checkWorkoutAchievements } from "@/lib/achievements";
import { updatePersonalRecordsForWorkout } from "@/lib/personal-records";

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

  // Aggregate total volume
  const setsForVolume = await prisma.workoutSet.findMany({
    where: { workoutId, completed: true, weightKg: { not: null }, reps: { not: null } },
    select: { weightKg: true, reps: true },
  });
  const totalVolumeKg = setsForVolume.reduce(
    (sum, s) => sum + ((s.weightKg ?? 0) * (s.reps ?? 0)),
    0,
  );

  const updated = await prisma.workout.update({
    where: { id: workoutId },
    data: {
      status: parsed.data.mode,
      finishedAt: new Date(),
      ...(intensityScore !== null ? { intensityScore } : {}),
      ...(parsed.data.notes !== undefined ? { notes: parsed.data.notes } : {}),
      ...(parsed.data.energyLevel !== undefined ? { energyLevel: parsed.data.energyLevel } : {}),
      ...(parsed.data.moodBefore !== undefined ? { moodBefore: parsed.data.moodBefore } : {}),
      ...(parsed.data.moodAfter !== undefined ? { moodAfter: parsed.data.moodAfter } : {}),
      ...(parsed.data.location !== undefined ? { location: parsed.data.location } : {}),
      ...(parsed.data.durationSeconds !== undefined ? { durationSeconds: parsed.data.durationSeconds } : {}),
      totalVolumeKg: Math.round(totalVolumeKg * 10) / 10,
    },
  });

  // Notify coach if workout was completed (not abandoned)
  if (parsed.data.mode === "COMPLETED") {
    // PR + Achievement evaluation (best-effort, do not fail the request)
    try {
      await updatePersonalRecordsForWorkout(workoutId);
      await checkWorkoutAchievements(auth.session.user.id);
    } catch (err) {
      console.error("[complete] PR/achievement update failed", err);
    }

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

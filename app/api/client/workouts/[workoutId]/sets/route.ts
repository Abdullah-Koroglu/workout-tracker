import { NextResponse } from "next/server";

import { requireAuth } from "@/lib/api-auth";
import { emitNotificationViaWs, notifPayload } from "@/lib/notify-ws";
import { prisma } from "@/lib/prisma";
import { saveSetSchema } from "@/validations/workout";

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
      template: { select: { coachId: true } },
      client: { select: { name: true } },
    },
  });
  if (!workout || workout.clientId !== auth.session.user.id) {
    return NextResponse.json({ error: "Workout not found" }, { status: 404 });
  }

  if (workout.status === "COMPLETED") {
    return NextResponse.json({ error: "Workout already completed" }, { status: 400 });
  }

  const body = await request.json();
  const parsed = saveSetSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  let previousMaxWeight: number | null = null;
  let isPR = false;

  if (parsed.data.completed && typeof parsed.data.weightKg === "number") {
    const previous = await prisma.workoutSet.aggregate({
      where: {
        exerciseId: parsed.data.exerciseId,
        completed: true,
        weightKg: { not: null },
        workoutId: { not: workoutId },
        workout: {
          clientId: auth.session.user.id,
          status: "COMPLETED"
        }
      },
      _max: {
        weightKg: true
      }
    });

    previousMaxWeight = previous._max.weightKg ?? null;
    isPR = previousMaxWeight === null || parsed.data.weightKg > previousMaxWeight;
  }

  const existingSet = await prisma.workoutSet.findFirst({
    where: {
      workoutId,
      exerciseId: parsed.data.exerciseId,
      setNumber: parsed.data.setNumber
    }
  });

  const set = existingSet
    ? await prisma.workoutSet.update({
        where: { id: existingSet.id },
        data: {
          weightKg: parsed.data.weightKg,
          reps: parsed.data.reps,
          rir: parsed.data.rir,
          durationMinutes: parsed.data.durationMinutes,
          durationSeconds: parsed.data.durationSeconds,
          completed: parsed.data.completed,
          actualRestSeconds: parsed.data.actualRestSeconds ?? null,
          groupInstanceId: parsed.data.groupInstanceId ?? null,
          dropIndex: parsed.data.dropIndex ?? null,
        }
      })
    : await prisma.workoutSet.create({
        data: {
          workoutId,
          exerciseId: parsed.data.exerciseId,
          setNumber: parsed.data.setNumber,
          weightKg: parsed.data.weightKg,
          reps: parsed.data.reps,
          rir: parsed.data.rir,
          durationMinutes: parsed.data.durationMinutes,
          durationSeconds: parsed.data.durationSeconds,
          completed: parsed.data.completed,
          actualRestSeconds: parsed.data.actualRestSeconds ?? null,
          groupInstanceId: parsed.data.groupInstanceId ?? null,
          dropIndex: parsed.data.dropIndex ?? null,
        }
      });

  if (parsed.data.completed) {
    const exercise = await prisma.exercise.findUnique({
      where: { id: parsed.data.exerciseId },
      select: { name: true },
    });

    const completedSetCount = await prisma.workoutSet.count({
      where: { workoutId, completed: true },
    });

    const clientName = workout.client.name ?? "Danışanın";
    const exerciseName = exercise?.name ?? "Egzersiz";
    const body = isPR
      ? `${clientName} ${exerciseName} set ${parsed.data.setNumber} tamamladı ve yeni PR yaptı.`
      : `${clientName} ${exerciseName} set ${parsed.data.setNumber} tamamladı. Toplam ${completedSetCount} set bitti.`;

    const notif = await prisma.notification.create({
      data: {
        userId: workout.template.coachId,
        title: isPR ? "Canlı ilerleme: PR" : "Canlı ilerleme",
        body,
        type: isPR ? "LIVE_SET_PR" : "LIVE_SET_PROGRESS",
      },
    });

    void emitNotificationViaWs(workout.template.coachId, notifPayload(notif));
  }

  return NextResponse.json(
    {
      set: {
        ...set,
        isPR,
        previousMaxWeight
      }
    },
    { status: 201 }
  );
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ workoutId: string }> }
) {
  const auth = await requireAuth("CLIENT");
  if (auth.error) return auth.error;

  const { workoutId } = await params;

  const workout = await prisma.workout.findUnique({ where: { id: workoutId } });
  if (!workout || workout.clientId !== auth.session.user.id) {
    return NextResponse.json({ error: "Workout not found" }, { status: 404 });
  }

  if (workout.status === "COMPLETED") {
    return NextResponse.json({ error: "Workout already completed" }, { status: 400 });
  }

  const body = await request.json().catch(() => ({}));
  const setId = typeof body?.setId === "string" ? body.setId : "";
  if (!setId) {
    return NextResponse.json({ error: "setId zorunlu" }, { status: 400 });
  }

  const existingSet = await prisma.workoutSet.findUnique({ where: { id: setId } });
  if (!existingSet || existingSet.workoutId !== workoutId) {
    return NextResponse.json({ error: "Set bulunamadi" }, { status: 404 });
  }

  await prisma.workoutSet.delete({ where: { id: setId } });

  return NextResponse.json({ success: true }, { status: 200 });
}

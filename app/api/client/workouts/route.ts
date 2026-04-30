import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";

import { requireAuth } from "@/lib/api-auth";
import { getCurrentDayStart } from "@/lib/current-date";
import { emitNotificationViaWs, notifPayload } from "@/lib/notify-ws";
import { prisma } from "@/lib/prisma";
import { sendPushNotification } from "@/lib/push-notifications";
import { startWorkoutSchema } from "@/validations/workout";

export async function POST(request: Request) {
  const auth = await requireAuth("CLIENT");
  if (auth.error) return auth.error;

  const body = await request.json();
  const parsed = startWorkoutSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const assignment = await prisma.templateAssignment.findUnique({
    where: { id: parsed.data.assignmentId },
    include: { template: { include: { exercises: { include: { exercise: true }, orderBy: { order: "asc" } } } } }
  });

  if (!assignment || assignment.clientId !== auth.session.user.id) {
    return NextResponse.json({ error: "Assignment not found" }, { status: 404 });
  }

  const assignmentDay = new Date(assignment.scheduledFor);
  assignmentDay.setHours(0, 0, 0, 0);

  const today = getCurrentDayStart();

  if (assignmentDay.getTime() !== today.getTime()) {
    return NextResponse.json(
      {
        error: `Bu template sadece ${assignmentDay.toLocaleDateString("tr-TR")} tarihinde yapılabilir.`
      },
      { status: 400 }
    );
  }

  const exerciseIds = assignment.template.exercises.map((item) => item.exerciseId);
  const previousSets = exerciseIds.length
    ? await prisma.workoutSet.findMany({
        where: {
          exerciseId: { in: exerciseIds },
          workout: {
            clientId: auth.session.user.id,
            status: "COMPLETED"
          },
          completed: true
        },
        include: {
          workout: {
            select: {
              startedAt: true
            }
          }
        },
        orderBy: [{ workout: { startedAt: "desc" } }, { setNumber: "desc" }]
      })
    : [];

  const suggestions = previousSets.reduce<
    Record<string, { suggestedWeightKg: number | null; suggestedReps: number | null; suggestedRir: number | null }>
  >((accumulator, set) => {
    if (!accumulator[set.exerciseId]) {
      accumulator[set.exerciseId] = {
        suggestedWeightKg: set.weightKg,
        suggestedReps: set.reps,
        suggestedRir: set.rir
      };
    }

    return accumulator;
  }, {});

  const exercises = assignment.template.exercises.map((exercise) => ({
    ...exercise,
    suggestedWeightKg: suggestions[exercise.exerciseId]?.suggestedWeightKg ?? null,
    suggestedReps: suggestions[exercise.exerciseId]?.suggestedReps ?? exercise.targetReps ?? null,
    suggestedRir: suggestions[exercise.exerciseId]?.suggestedRir ?? exercise.targetRir ?? null
  }));

  const consumedWorkout = assignment.isOneTime
    ? await prisma.workout.findFirst({
        where: {
          assignmentId: assignment.id,
          clientId: auth.session.user.id,
          status: {
            in: ["COMPLETED", "ABANDONED"]
          }
        },
        select: { id: true }
      })
    : null;

  if (consumedWorkout) {
    await prisma.workout.updateMany({
      where: {
        assignmentId: assignment.id,
        clientId: auth.session.user.id,
        status: "IN_PROGRESS"
      },
      data: {
        status: "ABANDONED",
        finishedAt: new Date()
      }
    });

    return NextResponse.json(
      {
        error: "Bu assignment tek kullanımlık olduğu için tekrar başlatılamaz.",
        workoutId: consumedWorkout.id
      },
      { status: 409 }
    );
  }

  const inProgressWorkouts = await prisma.workout.findMany({
    where: {
      assignmentId: assignment.id,
      clientId: auth.session.user.id,
      status: "IN_PROGRESS"
    },
    include: {
      sets: true
    },
    orderBy: { startedAt: "desc" }
  });

  const existingWorkout = inProgressWorkouts[0];

  if (inProgressWorkouts.length > 1) {
    const staleIds = inProgressWorkouts.slice(1).map((workout) => workout.id);
    if (staleIds.length) {
      await prisma.workout.updateMany({
        where: { id: { in: staleIds } },
        data: {
          status: "ABANDONED",
          finishedAt: new Date()
        }
      });
    }
  }

  if (existingWorkout) {
    return NextResponse.json(
      {
        workoutId: existingWorkout.id,
        exercises,
        existingSets: existingWorkout.sets,
        assignment: {
          id: assignment.id,
          scheduledFor: assignment.scheduledFor,
          isOneTime: assignment.isOneTime
        }
      },
      { status: 200 }
    );
  }

  const workout = await prisma.workout.create({
    data: {
      clientId: auth.session.user.id,
      templateId: assignment.templateId,
      assignmentId: assignment.id,
      status: "IN_PROGRESS"
    },
    include: { sets: true }
  });

  const coachId = assignment.template.coachId;
  const clientName = auth.session.user.name ?? "Danışanın";
  const notif = await prisma.notification.create({
    data: {
      userId: coachId,
      title: "Canlı antrenman başladı",
      body: `${clientName} "${assignment.template.name}" antrenmanını başlattı.`,
      type: "WORKOUT_STARTED",
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

  return NextResponse.json(
    {
      workoutId: workout.id,
      exercises,
      existingSets: workout.sets,
      assignment: {
        id: assignment.id,
        scheduledFor: assignment.scheduledFor,
        isOneTime: assignment.isOneTime
      }
    },
    { status: 201 }
  );
}

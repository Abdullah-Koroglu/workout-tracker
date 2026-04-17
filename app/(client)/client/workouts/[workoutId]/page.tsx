import Link from "next/link";
import { ChevronLeft, Calendar, Clock, MessageSquare } from "lucide-react";
import { notFound } from "next/navigation";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { WorkoutShareCard } from "@/components/client/WorkoutShareCard";

export default async function WorkoutDetailPage({
  params,
}: {
  params: Promise<{ workoutId: string }>;
}) {
  const session = await auth();
  if (!session || session.user.role !== "CLIENT") {
    return null;
  }

  const { workoutId } = await params;

  const workout = await prisma.workout.findUnique({
    where: { id: workoutId },
    include: {
      template: true,
      sets: {
        include: { exercise: true },
        orderBy: [{ exerciseId: "asc" }, { setNumber: "asc" }],
      },
      comments: {
        include: { author: true },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!workout || workout.clientId !== session.user.id) {
    return notFound();
  }

  // Group sets by exercise
  const setsByExercise: Record<
    string,
    Array<{
      id: string;
      exerciseName: string;
      setNumber: number;
      weightKg: number | null;
      reps: number | null;
      rir: number | null;
    }>
  > = {};

  workout.sets.forEach((set) => {
    if (!setsByExercise[set.exercise.name]) {
      setsByExercise[set.exercise.name] = [];
    }
    setsByExercise[set.exercise.name].push({
      id: set.id,
      exerciseName: set.exercise.name,
      setNumber: set.setNumber,
      weightKg: set.weightKg,
      reps: set.reps,
      rir: set.rir,
    });
  });

  const workoutDate = workout.finishedAt
    ? new Date(workout.finishedAt)
    : new Date(workout.startedAt);

  const workoutDuration = workout.finishedAt
    ? Math.round(
        (workout.finishedAt.getTime() - workout.startedAt.getTime()) / 60000
      )
    : null;

  const totalVolumeKg = workout.sets.reduce((sum, set) => {
    if (!set.completed || set.weightKg === null || set.reps === null) {
      return sum;
    }

    return sum + set.weightKg * set.reps;
  }, 0);

  const weightExerciseIds = Array.from(
    new Set(
      workout.sets
        .filter((set) => set.completed && set.weightKg !== null)
        .map((set) => set.exerciseId)
    )
  );

  const previousSets = weightExerciseIds.length
    ? await prisma.workoutSet.findMany({
        where: {
          exerciseId: { in: weightExerciseIds },
          completed: true,
          weightKg: { not: null },
          workout: {
            clientId: session.user.id,
            status: "COMPLETED",
            startedAt: {
              lt: workout.startedAt
            }
          }
        },
        select: {
          exerciseId: true,
          weightKg: true
        }
      })
    : [];

  const previousMaxByExercise = previousSets.reduce<Record<string, number>>((acc, item) => {
    if (item.weightKg === null) {
      return acc;
    }

    const current = acc[item.exerciseId] ?? 0;
    if (item.weightKg > current) {
      acc[item.exerciseId] = item.weightKg;
    }

    return acc;
  }, {});

  const prExerciseNames = Array.from(
    new Set(
      workout.sets
        .filter((set) => {
          if (!set.completed || set.weightKg === null) {
            return false;
          }

          const previousMax = previousMaxByExercise[set.exerciseId];
          return previousMax === undefined || set.weightKg > previousMax;
        })
        .map((set) => set.exercise.name)
    )
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          href="/client/workouts"
          className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100"
        >
          <ChevronLeft className="w-4 h-4" />
          Geri
        </Link>
        <h1 className="text-3xl font-bold">{workout.template.name}</h1>
      </div>

      {/* Workout Info */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        <div className="flex items-center gap-3 p-4 bg-white rounded-lg shadow dark:bg-gray-800">
          <Calendar className="w-5 h-5 text-green-600" />
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400">Tarih</p>
            <p className="font-semibold">
              {workoutDate.toLocaleDateString("tr-TR")}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 p-4 bg-white rounded-lg shadow dark:bg-gray-800">
          <Clock className="w-5 h-5 text-green-600" />
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400">Süre</p>
            <p className="font-semibold">
              {workoutDuration ? `${workoutDuration} dakika` : "-"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 p-4 bg-white rounded-lg shadow dark:bg-gray-800">
          <MessageSquare className="w-5 h-5 text-green-600" />
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400">Yorumlar</p>
            <p className="font-semibold">{workout.comments.length}</p>
          </div>
        </div>

        <div className="flex items-center gap-3 p-4 bg-white rounded-lg shadow dark:bg-gray-800">
          <MessageSquare className="w-5 h-5 text-green-600" />
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400">Durum</p>
            <p className="font-semibold">
              {workout.status === "ABANDONED" ? "Yarıda bırakıldı" : workout.status === "COMPLETED" ? "Tamamlandı" : "Devam ediyor"}
            </p>
          </div>
        </div>
      </div>

      {/* Set Details */}
      <div className="space-y-4">
        <h2 className="text-2xl font-bold">Set Detayları</h2>

        {Object.entries(setsByExercise).length === 0 ? (
          <div className="p-8 bg-gray-50 rounded-lg text-center dark:bg-gray-800">
            <p className="text-gray-500 dark:text-gray-400">
              Bu antrenman için kayıtlı set bulunmamaktadır
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {Object.entries(setsByExercise).map(([exerciseName, sets]) => (
              <div
                key={exerciseName}
                className="bg-white rounded-lg shadow overflow-hidden dark:bg-gray-800"
              >
                <div className="bg-green-50 dark:bg-green-900/20 px-4 py-3 border-b border-green-200 dark:border-green-900">
                  <h3 className="font-semibold text-gray-900 dark:text-white">
                    {exerciseName}
                  </h3>
                </div>

                <div className="divide-y dark:divide-gray-700">
                  {sets.map((set) => (
                    <div
                      key={set.id}
                      className="p-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                    >
                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Set {set.setNumber}
                        </p>
                      </div>
                      <div className="flex items-center gap-6 text-sm">
                        {set.weightKg !== null && (
                          <div className="text-right">
                            <p className="text-xs text-gray-600 dark:text-gray-400">
                              Ağırlık
                            </p>
                            <p className="font-semibold">
                              {set.weightKg} <span className="text-xs">kg</span>
                            </p>
                          </div>
                        )}
                        {set.reps !== null && (
                          <div className="text-right">
                            <p className="text-xs text-gray-600 dark:text-gray-400">
                              Tekrar
                            </p>
                            <p className="font-semibold">{set.reps}</p>
                          </div>
                        )}
                        {set.rir !== null && (
                          <div className="text-right">
                            <p className="text-xs text-gray-600 dark:text-gray-400">
                              RIR
                            </p>
                            <p className="font-semibold">{set.rir}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <WorkoutShareCard
        title={workout.template.name}
        durationMinutes={workoutDuration}
        totalVolumeKg={Math.round(totalVolumeKg)}
        prExerciseNames={prExerciseNames}
      />

      {/* Coach Comments */}
      <div className="space-y-4">
        <h2 className="text-2xl font-bold">Antrenör Yorumları</h2>

        {workout.comments.length === 0 ? (
          <div className="p-8 bg-gray-50 rounded-lg text-center dark:bg-gray-800">
            <p className="text-gray-500 dark:text-gray-400">
              Henüz yorum yapılmamıştır
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {workout.comments.map((comment) => (
              <div
                key={comment.id}
                className="bg-white rounded-lg shadow p-4 dark:bg-gray-800 border-l-4 border-blue-500"
              >
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white">
                      {comment.author.name}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {new Date(comment.createdAt).toLocaleDateString("tr-TR", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                </div>
                <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                  {comment.content}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

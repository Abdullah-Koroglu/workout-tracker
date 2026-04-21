import Link from "next/link";
import { CheckCircle2, ChevronLeft, Clock, Dumbbell, Flame, LayoutDashboard, MessageSquare, Trophy, Weight, XCircle } from "lucide-react";
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

  const totalSets = workout.sets.filter((s) => s.completed).length;

  return (
    <div className="space-y-4 pb-8 md:space-y-6">
      {/* Hero Header */}
      <div className={`overflow-hidden rounded-2xl md:rounded-3xl shadow-sm ${
        workout.status === "COMPLETED"
          ? "bg-gradient-to-br from-card via-muted/20 to-background ring-1 ring-black/5"
          : workout.status === "ABANDONED"
          ? "bg-gradient-to-br from-card via-muted/30 to-background ring-1 ring-black/5"
          : "bg-card ring-1 ring-black/5"
      }`}>
        <div className="px-4 py-4 md:px-6 md:py-5">
          {/* Back + status */}
          <div className="flex items-center justify-between gap-2">
            <Link
              href="/client/workouts"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
              Antrenmanlar
            </Link>
            {workout.status === "COMPLETED" ? (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-secondary/20 px-3 py-1 text-xs font-bold text-secondary">
                <CheckCircle2 className="h-3.5 w-3.5" />
                Tamamlandı
              </span>
            ) : workout.status === "ABANDONED" ? (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/15 px-3 py-1 text-xs font-bold text-foreground">
                <XCircle className="h-3.5 w-3.5" />
                Yarıda Bırakıldı
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-100 px-3 py-1 text-xs font-bold text-blue-800">
                Devam Ediyor
              </span>
            )}
          </div>

          {/* Title */}
          <div className="mt-3">
            <p className="text-[11px] font-bold uppercase tracking-widest text-emerald-700 md:text-xs">
              Workout Summary
            </p>
            <p className="text-[11px] font-bold uppercase tracking-widest text-primary md:text-xs hidden">
              Antrenman Özeti
            </p>
            <h1 className="mt-1 text-xl font-black leading-tight text-slate-900 md:text-3xl">
              {workout.template.name}
            </h1>
            <p className="mt-1 text-xs text-slate-500 md:text-sm">
              {workoutDate.toLocaleDateString("tr-TR", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </p>
          </div>

          {/* Stats Row */}
          <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
            <div className="rounded-lg bg-background px-3 py-2.5 shadow-sm ring-1 ring-black/5 md:px-4 md:py-3">
              <div className="flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5 text-primary" />
                <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Süre</p>
              </div>
              <p className="mt-1 text-xl font-black text-slate-900 md:text-2xl">
                {workoutDuration ?? "-"}
                <span className="ml-1 text-xs font-semibold text-slate-500">dk</span>
              </p>
            </div>

            <div className="rounded-lg bg-background px-3 py-2.5 shadow-sm ring-1 ring-black/5 md:px-4 md:py-3">
              <div className="flex items-center gap-1.5">
                <Weight className="h-3.5 w-3.5 text-secondary" />
                <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Hacim</p>
              </div>
              <p className="mt-1 text-xl font-black text-slate-900 md:text-2xl">
                {Math.round(totalVolumeKg).toLocaleString("tr-TR")}
                <span className="ml-1 text-xs font-semibold text-slate-500">kg</span>
              </p>
            </div>

            <div className="rounded-lg bg-background px-3 py-2.5 shadow-sm ring-1 ring-black/5 md:px-4 md:py-3">
              <div className="flex items-center gap-1.5">
                <Dumbbell className="h-3.5 w-3.5 text-secondary" />
                <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Set</p>
              </div>
              <p className="mt-1 text-xl font-black text-slate-900 md:text-2xl">
                {totalSets}
              </p>
            </div>

            <div className="rounded-lg bg-background px-3 py-2.5 shadow-sm ring-1 ring-black/5 md:px-4 md:py-3">
              <div className="flex items-center gap-1.5">
                <Trophy className="h-3.5 w-3.5 text-primary" />
                <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">PR</p>
              </div>
              <p className="mt-1 text-xl font-black text-slate-900 md:text-2xl">
                {prExerciseNames.length}
              </p>
            </div>
          </div>

          {/* PR Banner */}
          {prExerciseNames.length > 0 && (
            <div className="mt-3 flex items-start gap-2 rounded-lg bg-primary/15 px-3 py-2.5">
              <Trophy className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
              <div>
                <p className="text-xs font-bold text-foreground">Kişisel Rekor!</p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {prExerciseNames.join(", ")}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Set Details */}
      <section className="space-y-3">
        <h2 className="text-sm font-bold uppercase tracking-widest text-muted-foreground md:text-base">
          Egzersiz Detayları
        </h2>

        {Object.entries(setsByExercise).length === 0 ? (
          <div className="rounded-2xl border border-dashed p-8 text-center">
            <p className="text-sm text-muted-foreground">Bu antrenman için kayıtlı set bulunmamaktadır.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {Object.entries(setsByExercise).map(([exerciseName, sets]) => {
              const firstSet = sets[0];
              const isCardio = firstSet.weightKg === null && firstSet.reps === null;
              const hasPR = sets.some((s) => {
                if (s.weightKg === null) return false;
                const exercise = workout.sets.find((ws) => ws.exercise.name === exerciseName);
                if (!exercise) return false;
                const prev = previousMaxByExercise[exercise.exerciseId];
                return prev === undefined || s.weightKg! > prev;
              });

              return (
                <div key={exerciseName} className="overflow-hidden rounded-2xl border bg-card shadow-sm">
                  {/* Exercise header */}
                  <div className={`flex items-center justify-between gap-2 px-4 py-3 ${
                    isCardio ? "bg-orange-50/60 border-b border-orange-100" : "bg-emerald-50/60 border-b border-emerald-100"
                  }`}>
                    <div className="flex items-center gap-2">
                      {isCardio ? (
                        <Flame className="h-4 w-4 text-orange-500 shrink-0" />
                      ) : (
                        <Dumbbell className="h-4 w-4 text-emerald-600 shrink-0" />
                      )}
                      <h3 className="font-bold text-sm text-slate-900">{exerciseName}</h3>
                      {hasPR && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-black uppercase text-amber-700">
                          <Trophy className="h-2.5 w-2.5" />
                          PR
                        </span>
                      )}
                    </div>
                    <span className="text-xs font-semibold text-muted-foreground">{sets.length} set</span>
                  </div>

                  {/* Sets */}
                  <div className="divide-y">
                    {sets.map((set) => (
                      <div
                        key={set.id}
                        className="flex items-center gap-3 px-4 py-2.5"
                      >
                        <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-muted text-[11px] font-bold text-muted-foreground">
                          {set.setNumber}
                        </div>
                        <div className="flex flex-1 flex-wrap items-center gap-x-4 gap-y-1">
                          {set.weightKg !== null && (
                            <div className="flex items-center gap-1 text-sm">
                              <span className="text-xs text-muted-foreground">Ağırlık</span>
                              <span className="font-bold text-slate-900">{set.weightKg} kg</span>
                            </div>
                          )}
                          {set.reps !== null && (
                            <div className="flex items-center gap-1 text-sm">
                              <span className="text-xs text-muted-foreground">Tekrar</span>
                              <span className="font-bold text-slate-900">{set.reps}</span>
                            </div>
                          )}
                          {set.rir !== null && (
                            <div className="flex items-center gap-1 text-sm">
                              <span className="text-xs text-muted-foreground">RIR</span>
                              <span className="font-bold text-slate-900">{set.rir}</span>
                            </div>
                          )}
                        </div>
                        {set.weightKg !== null && (() => {
                          const exercise = workout.sets.find((ws) => ws.exercise.name === exerciseName);
                          if (!exercise) return null;
                          const prev = previousMaxByExercise[exercise.exerciseId];
                          if ((prev === undefined || set.weightKg! > prev)) {
                            return (
                              <span className="shrink-0 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-black text-amber-700">
                                PR
                              </span>
                            );
                          }
                          return null;
                        })()}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Share Card */}
      <WorkoutShareCard
        title={workout.template.name}
        durationMinutes={workoutDuration}
        totalVolumeKg={Math.round(totalVolumeKg)}
        prExerciseNames={prExerciseNames}
        workoutDate={workoutDate}
        totalSets={totalSets}
      />

      {/* Coach Comments */}
      <section className="space-y-3">
        <div className="flex items-center gap-2">
          <MessageSquare className="h-4 w-4 text-muted-foreground" />
          <h2 className="text-sm font-bold uppercase tracking-widest text-muted-foreground md:text-base">
            Antrenör Yorumları
          </h2>
          {workout.comments.length > 0 && (
            <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[11px] font-bold text-blue-700">
              {workout.comments.length}
            </span>
          )}
        </div>

        {workout.comments.length === 0 ? (
          <div className="rounded-2xl border border-dashed p-8 text-center">
            <p className="text-sm text-muted-foreground">Henüz antrenör yorumu bulunmamaktadır.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {workout.comments.map((comment) => (
              <div
                key={comment.id}
                className="rounded-2xl border bg-card p-4 shadow-sm"
              >
                <div className="flex items-start gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-700">
                    {comment.author.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline justify-between gap-2">
                      <p className="text-sm font-semibold text-slate-900">{comment.author.name}</p>
                      <p className="shrink-0 text-xs text-muted-foreground">
                        {new Date(comment.createdAt).toLocaleDateString("tr-TR", {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                    <p className="mt-1.5 text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">
                      {comment.content}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Action Buttons */}
      <div className="flex flex-col gap-2 pt-2 sm:flex-row">
        <Link
          href="/client/dashboard"
          className="flex flex-1 items-center justify-center gap-2 rounded-2xl border bg-card px-4 py-3 text-sm font-semibold text-foreground shadow-sm hover:bg-muted transition"
        >
          <LayoutDashboard className="h-4 w-4" />
          Dashboard
        </Link>
        <Link
          href="/client/workouts"
          className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-gradient-to-br from-primary to-[hsl(24_95%_60%)] px-4 py-3 text-sm font-semibold text-white shadow-sm hover:brightness-105 transition"
        >
          <Dumbbell className="h-4 w-4" />
          Tüm Antrenmanlar
        </Link>
      </div>
    </div>
  );
}

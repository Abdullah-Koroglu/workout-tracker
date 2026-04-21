import Link from "next/link";
import { Calendar, CheckCircle2, ChevronLeft, Clock, Dumbbell, Flame, MessageSquare, Share2, Trophy, Weight, XCircle } from "lucide-react";
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
    notFound();
  }

  const setsByExercise: Record<
    string,
    Array<{
      id: string;
      setNumber: number;
      weightKg: number | null;
      reps: number | null;
      rir: number | null;
      exerciseId: string;
    }>
  > = {};

  workout.sets.forEach((set) => {
    if (!setsByExercise[set.exercise.name]) {
      setsByExercise[set.exercise.name] = [];
    }

    setsByExercise[set.exercise.name].push({
      id: set.id,
      setNumber: set.setNumber,
      weightKg: set.weightKg,
      reps: set.reps,
      rir: set.rir,
      exerciseId: set.exerciseId,
    });
  });

  const workoutDate = workout.finishedAt
    ? new Date(workout.finishedAt)
    : new Date(workout.startedAt);

  const workoutDuration = workout.finishedAt
    ? Math.round((workout.finishedAt.getTime() - workout.startedAt.getTime()) / 60000)
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
              lt: workout.startedAt,
            },
          },
        },
        select: {
          exerciseId: true,
          weightKg: true,
        },
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
  const durationText = workoutDuration ? `${Math.floor(workoutDuration / 60)}h ${workoutDuration % 60}m` : "-";
  const intensityScore = Math.min(10, Math.max(1, Math.round((totalSets / Math.max(workout.sets.length, 1)) * 10)));

  return (
    <div className="space-y-8 pb-8">
      <section className="flex items-center justify-between">
        <Link href="/client/workouts" className="inline-flex items-center gap-2 rounded-full p-2 text-slate-500 hover:bg-slate-100">
          <ChevronLeft className="h-4 w-4" />
          <span className="text-xs font-semibold uppercase tracking-widest">Back</span>
        </Link>
        <button type="button" className="inline-flex items-center gap-2 rounded-lg bg-surface-container-high px-4 py-2 text-sm font-bold text-on-secondary-container hover:bg-surface-dim">
          <Share2 className="h-4 w-4" />
          Export Data
        </button>
      </section>

      {workout.status === "COMPLETED" ? (
        <section className="py-6 text-center">
          <div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-tr from-primary to-primary-container shadow-[0_0_40px_rgba(249,115,22,0.3)]">
            <Trophy className="h-12 w-12 text-on-primary" />
          </div>
          <h2 className="text-4xl font-black uppercase tracking-tight text-on-surface">Workout Complete!</h2>
          <p className="mt-2 text-lg text-secondary">{workout.template.name}</p>
        </section>
      ) : (
        <section className="flex flex-col gap-2">
          <div className="flex items-center gap-3">
            <span className="rounded-full bg-secondary-container px-3 py-1 text-xs font-bold uppercase tracking-widest text-on-secondary-container">Historical Detail</span>
            <span className="inline-flex items-center gap-1 text-sm text-on-surface-variant">
              <Calendar className="h-4 w-4" />
              {workoutDate.toLocaleDateString("tr-TR")}
            </span>
          </div>
          <h1 className="text-4xl font-black tracking-tight text-on-surface">{workout.template.name}</h1>
          <p className="text-sm text-on-surface-variant">Completed at Elite Performance Center</p>
        </section>
      )}

      <section className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <div className="relative overflow-hidden rounded-lg bg-surface-container-low p-5">
          <div className="flex items-center gap-2 text-secondary">
            <Clock className="h-4 w-4" />
            <span className="text-[10px] font-bold uppercase tracking-widest">Time</span>
          </div>
          <div className="mt-1 text-3xl font-bold text-on-surface">{durationText}</div>
        </div>
        <div className="relative overflow-hidden rounded-lg bg-surface-container-low p-5">
          <div className="flex items-center gap-2 text-secondary">
            <Weight className="h-4 w-4" />
            <span className="text-[10px] font-bold uppercase tracking-widest">Volume</span>
          </div>
          <div className="mt-1 text-3xl font-bold text-primary">{Math.round(totalVolumeKg).toLocaleString("tr-TR")} <span className="text-sm font-normal text-secondary">kg</span></div>
        </div>
        <div className="relative overflow-hidden rounded-lg bg-surface-container-low p-5">
          <div className="flex items-center gap-2 text-secondary">
            <Dumbbell className="h-4 w-4" />
            <span className="text-[10px] font-bold uppercase tracking-widest">Sets</span>
          </div>
          <div className="mt-1 text-3xl font-bold text-on-surface">{totalSets}</div>
        </div>
        <div className="relative overflow-hidden rounded-lg border-b-2 border-primary bg-surface-container-highest p-5">
          <div className="flex items-center gap-2 text-secondary">
            <Flame className="h-4 w-4 text-primary" />
            <span className="text-[10px] font-bold uppercase tracking-widest">Intensity</span>
          </div>
          <div className="mt-1 text-3xl font-bold text-primary">{intensityScore} <span className="text-sm font-normal text-secondary">/ 10</span></div>
        </div>
      </section>

      {prExerciseNames.length > 0 ? (
        <section className="rounded-lg bg-surface-container-low p-6">
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2 text-secondary">
              <Trophy className="h-4 w-4 text-tertiary" />
              <span className="text-[10px] font-bold uppercase tracking-widest">New PRs</span>
            </div>
            <span className="rounded-full bg-tertiary-fixed px-2 py-1 text-xs font-bold text-on-tertiary-container">{prExerciseNames.length} Achieved</span>
          </div>
          <div className="space-y-2">
            {prExerciseNames.map((name) => (
              <div key={name} className="flex items-center justify-between text-sm">
                <span className="font-medium text-on-surface">{name}</span>
                <span className="font-bold text-tertiary">PR</span>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        <section className="flex flex-col gap-6 lg:col-span-2">
          <h2 className="border-b border-surface-container-high pb-4 text-2xl font-bold text-on-surface">Exercise Breakdown</h2>
          {Object.entries(setsByExercise).length === 0 ? (
            <div className="rounded-lg border border-dashed p-8 text-center text-sm text-on-surface-variant">Bu antrenman icin kayitli set yok.</div>
          ) : (
            Object.entries(setsByExercise).map(([exerciseName, sets]) => {
              const firstSet = sets[0];
              const isCardio = firstSet.weightKg === null && firstSet.reps === null;

              return (
                <div key={exerciseName} className="overflow-hidden rounded-lg bg-surface-container-lowest shadow-[0_4px_24px_rgba(0,0,0,0.02)]">
                  <div className="flex items-center justify-between bg-surface-container-low p-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary text-on-secondary">
                        {isCardio ? <Flame className="h-4 w-4" /> : <Dumbbell className="h-4 w-4" />}
                      </div>
                      <h3 className="text-lg font-bold text-on-surface">{exerciseName}</h3>
                    </div>
                    <span className="rounded-full bg-surface-variant px-3 py-1 text-xs font-bold uppercase tracking-widest text-on-surface-variant">{isCardio ? "Cardio" : "Primary"}</span>
                  </div>
                  <div className="p-4">
                    <table className="w-full border-collapse text-left">
                      <thead>
                        <tr className="border-b border-surface-container-high">
                          <th className="w-16 py-2 text-xs font-bold uppercase tracking-widest text-on-surface-variant">Set</th>
                          <th className="py-2 text-xs font-bold uppercase tracking-widest text-on-surface-variant">Weight</th>
                          <th className="py-2 text-xs font-bold uppercase tracking-widest text-on-surface-variant">Reps</th>
                          <th className="py-2 text-right text-xs font-bold uppercase tracking-widest text-on-surface-variant">RIR</th>
                        </tr>
                      </thead>
                      <tbody>
                        {sets.map((set) => {
                          const prev = previousMaxByExercise[set.exerciseId];
                          const isPrSet = set.weightKg !== null && (prev === undefined || set.weightKg > prev);

                          return (
                            <tr key={set.id} className="border-b border-surface-container last:border-b-0">
                              <td className="py-3 text-sm font-medium text-on-surface">{set.setNumber}</td>
                              <td className="py-3 text-sm font-bold text-on-surface">
                                {set.weightKg ?? "-"} {set.weightKg !== null ? "kg" : ""}
                                {isPrSet ? <span className="ml-2 text-[10px] font-black uppercase text-primary">PR</span> : null}
                              </td>
                              <td className="py-3 text-sm font-bold text-on-surface">{set.reps ?? "-"}</td>
                              <td className="py-3 text-right text-sm text-on-surface-variant">{set.rir ?? "-"}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              );
            })
          )}
        </section>

        <section className="flex flex-col gap-6 lg:col-span-1">
          <div className="relative overflow-hidden rounded-lg bg-secondary p-6 text-on-secondary shadow-[0_8px_32px_rgba(0,0,0,0.08)]">
            <h2 className="mb-4 flex items-center gap-2 text-sm font-bold uppercase tracking-widest">
              <CheckCircle2 className="h-4 w-4" /> Coach Assessment
            </h2>
            {workout.comments.length === 0 ? (
              <p className="text-sm leading-relaxed text-secondary-fixed">Henuz coach degerlendirmesi yok.</p>
            ) : (
              <div className="space-y-3">
                {workout.comments.slice(0, 2).map((comment) => (
                  <div key={comment.id}>
                    <p className="text-xs text-secondary-fixed-dim">{comment.author.name}</p>
                    <p className="text-sm leading-relaxed text-secondary-fixed">"{comment.content}"</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="rounded-lg bg-surface-container-low p-6">
            <h2 className="mb-4 flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-on-surface">
              <MessageSquare className="h-4 w-4" /> Athlete Log
            </h2>
            <p className="border-l-2 border-outline-variant py-1 pl-4 text-sm italic leading-relaxed text-on-surface-variant">
              Bu ekranda athlete serbest not kaydi Stitch tasariminda mevcut. Uygulama tarafinda henuz workout bazli athlete note modeli yok.
            </p>
          </div>

          {workout.status === "COMPLETED" ? (
            <div className="rounded-lg border border-outline-variant/15 bg-surface-container-lowest p-6 shadow-[0_8px_32px_rgba(0,0,0,0.02)]">
              <h3 className="mb-3 text-lg font-bold text-on-surface">Rate Intensity</h3>
              <p className="mb-3 text-sm text-secondary">How challenging was this session overall?</p>
              <div className="flex flex-wrap gap-2">
                {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
                  <button
                    key={n}
                    type="button"
                    className={`h-10 w-10 rounded-full font-bold transition-colors ${
                      n === intensityScore
                        ? "scale-110 bg-primary text-on-primary shadow-[0_4px_12px_rgba(157,67,0,0.3)]"
                        : "bg-surface-container-low text-secondary hover:bg-surface-container"
                    }`}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>
          ) : null}
        </section>
      </div>

      <WorkoutShareCard
        title={workout.template.name}
        durationMinutes={workoutDuration}
        totalVolumeKg={Math.round(totalVolumeKg)}
        prExerciseNames={prExerciseNames}
        workoutDate={workoutDate}
        totalSets={totalSets}
      />

      <section className="grid gap-3 sm:grid-cols-2">
        <Link href="/client/workouts" className="inline-flex items-center justify-center gap-2 rounded-lg bg-surface-container-high px-4 py-4 font-bold text-on-secondary-container hover:bg-surface-container-highest">
          <ChevronLeft className="h-4 w-4" /> Back to History
        </Link>
        <Link href="/client/dashboard" className="inline-flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-primary to-primary-container px-4 py-4 font-bold text-on-primary shadow-[0_8px_24px_rgba(249,115,22,0.25)]">
          {workout.status === "ABANDONED" ? <XCircle className="h-4 w-4" /> : <CheckCircle2 className="h-4 w-4" />}
          Continue
        </Link>
      </section>
    </div>
  );
}

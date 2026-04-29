import Link from "next/link";
import { notFound } from "next/navigation";
import {
  Award,
  CheckCircle2,
  ChevronLeft,
  Clock,
  Dumbbell,
  Flame,
  MessageSquare,
  Trophy,
  Weight,
  XCircle,
  Zap,
} from "lucide-react";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { WorkoutShareCard } from "@/components/client/WorkoutShareCard";
import { PageHero } from "@/components/shared/PageHero";

export default async function WorkoutDetailPage({
  params,
}: {
  params: Promise<{ workoutId: string }>;
}) {
  const session = await auth();
  if (!session || session.user.role !== "CLIENT") return null;

  const { workoutId } = await params;

  const workout = await prisma.workout.findUnique({
    where: { id: workoutId },
    include: {
      template: {
        include: {
          exercises: {
            orderBy: { order: "asc" },
            include: { exercise: true },
          },
        },
      },
      sets: {
        include: { exercise: true },
        orderBy: [{ setNumber: "asc" }],
      },
      client: { select: { name: true } },
      comments: {
        include: { author: true },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!workout || workout.clientId !== session.user.id) notFound();

  const coachRelation = await prisma.coachClientRelation.findFirst({
    where: { clientId: session.user.id, status: "ACCEPTED" },
    include: { coach: { select: { name: true } } },
  });

  /* ── Derived data ── */
  const isCompleted = workout.status === "COMPLETED";

  /* Build exercise order from template */
  const exerciseOrderMap = new Map(
    workout.template.exercises.map((te) => [te.exercise.name, te.order])
  );

  const setsByExercise: Record<string, typeof workout.sets> = {};
  workout.sets.forEach((set) => {
    const key = set.exercise.name;
    if (!setsByExercise[key]) setsByExercise[key] = [];
    setsByExercise[key].push(set);
  });

  const workoutDate = workout.finishedAt ?? workout.startedAt;
  const durationMin = workout.finishedAt
    ? Math.round((workout.finishedAt.getTime() - workout.startedAt.getTime()) / 60000)
    : null;

  const totalVolumeKg = workout.sets.reduce((sum, s) => {
    if (!s.completed || s.weightKg === null || s.reps === null) return sum;
    return sum + s.weightKg * s.reps;
  }, 0);

  const completedSets = workout.sets.filter((s) => s.completed).length;

  const intensityScore = Math.min(
    10,
    Math.max(1, Math.round((completedSets / Math.max(workout.sets.length, 1)) * 10))
  );

  /* PR detection */
  const weightExerciseIds = Array.from(
    new Set(
      workout.sets
        .filter((s) => s.completed && s.weightKg !== null)
        .map((s) => s.exerciseId)
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
            startedAt: { lt: workout.startedAt },
          },
        },
        select: { exerciseId: true, weightKg: true },
      })
    : [];

  const prevMaxByExercise = previousSets.reduce<Record<string, number>>((acc, s) => {
    if (s.weightKg === null) return acc;
    acc[s.exerciseId] = Math.max(acc[s.exerciseId] ?? 0, s.weightKg);
    return acc;
  }, {});

  const prExerciseNames = Array.from(
    new Set(
      workout.sets
        .filter((s) => {
          if (!s.completed || s.weightKg === null) return false;
          const prev = prevMaxByExercise[s.exerciseId];
          return prev === undefined || s.weightKg > prev;
        })
        .map((s) => s.exercise.name)
    )
  );

  const durationText = durationMin
    ? durationMin >= 60
      ? `${Math.floor(durationMin / 60)}s ${durationMin % 60}dk`
      : `${durationMin} dk`
    : "—";

  /* ── Stat cards config ── */
  const stats = [
    {
      icon: Clock,
      label: "Süre",
      value: durationText,
      color: "#2563EB",
      bg: "rgba(37,99,235,0.08)",
    },
    {
      icon: Weight,
      label: "Toplam Hacim",
      value: `${Math.round(totalVolumeKg).toLocaleString("tr-TR")} kg`,
      color: "#FB923C",
      bg: "rgba(249,115,22,0.08)",
    },
    {
      icon: Dumbbell,
      label: "Tamamlanan Set",
      value: `${completedSets}`,
      color: "#1A365D",
      bg: "rgba(26,54,93,0.08)",
    },
    {
      icon: Zap,
      label: "Yoğunluk",
      value: `${intensityScore} / 10`,
      color: "#16A34A",
      bg: "rgba(22,163,74,0.08)",
    },
  ];

  return (
    <div className="space-y-6 pb-12">

      {/* ── Back link ── */}
      <Link
        href="/client/workouts"
        className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-400 transition-colors hover:text-slate-700"
      >
        <ChevronLeft className="h-3.5 w-3.5" />
        Antrenman Geçmişi
      </Link>

      {/* ── Hero banner ── */}
      <PageHero
        title={workout.template.name}
        subtitle={workoutDate.toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" })}
        glowColor={isCompleted ? "green" : "amber"}
        badge={isCompleted
          ? { label: "Tamamlandı",     color: "#22C55E", bg: "rgba(34,197,94,0.15)",  border: "rgba(34,197,94,0.25)",  icon: CheckCircle2 }
          : { label: "Yarıda Bırakıldı", color: "#F59E0B", bg: "rgba(245,158,11,0.15)", border: "rgba(245,158,11,0.25)", icon: XCircle }
        }
      >
        {isCompleted && prExerciseNames.length > 0 && (
          <div
            className="inline-flex items-center gap-2 rounded-xl px-4 py-2.5"
            style={{ background: "rgba(251,191,36,0.12)", border: "1px solid rgba(251,191,36,0.2)" }}
          >
            <Trophy className="h-4 w-4 text-amber-400" />
            <span className="text-xs font-black text-amber-300">
              {prExerciseNames.length} yeni PR kırıldı! &nbsp;—&nbsp;
              <span className="font-semibold opacity-80">
                {prExerciseNames.slice(0, 3).join(", ")}
                {prExerciseNames.length > 3 ? ` +${prExerciseNames.length - 3}` : ""}
              </span>
            </span>
          </div>
        )}
      </PageHero>

      {/* ── Stat cards ── */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {stats.map(({ icon: Icon, label, value, color, bg }) => (
          <div
            key={label}
            className="flex flex-col rounded-2xl bg-white p-5"
            style={{ boxShadow: "0 2px 16px rgba(0,0,0,0.06), 0 1px 3px rgba(0,0,0,0.04)" }}
          >
            <div
              className="mb-3 flex h-9 w-9 items-center justify-center rounded-xl"
              style={{ background: bg }}
            >
              <Icon className="h-4 w-4" style={{ color }} />
            </div>
            <p className="text-2xl font-black text-slate-800 leading-none">{value}</p>
            <p className="mt-1.5 text-[10px] font-black uppercase tracking-wider text-slate-400">{label}</p>
          </div>
        ))}
      </div>

      {/* ── Main 2-col layout ── */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">

        {/* ── LEFT: Exercise breakdown ── */}
        <div className="xl:col-span-2 space-y-4">
          <div className="flex items-center gap-2">
            <div
              className="flex h-8 w-8 items-center justify-center rounded-xl"
              style={{ background: "rgba(249,115,22,0.1)" }}
            >
              <Dumbbell className="h-4 w-4 text-orange-500" />
            </div>
            <h2 className="text-base font-black text-slate-800">Egzersiz Detayı</h2>
            <span
              className="rounded-full px-2.5 py-0.5 text-xs font-black"
              style={{ background: "rgba(249,115,22,0.1)", color: "#EA580C" }}
            >
              {Object.keys(setsByExercise).length}
            </span>
          </div>

          {Object.keys(setsByExercise).length === 0 ? (
            <div
              className="rounded-2xl bg-white p-8 text-center"
              style={{ boxShadow: "0 2px 16px rgba(0,0,0,0.06)" }}
            >
              <p className="text-sm text-slate-400">Bu antrenman için kayıtlı set bulunamadı.</p>
            </div>
          ) : (
            Object.entries(setsByExercise)
              .sort(([a], [b]) => (exerciseOrderMap.get(a) ?? 999) - (exerciseOrderMap.get(b) ?? 999))
              .map(([exerciseName, sets]) => {
              const isCardio = sets[0].weightKg === null && sets[0].reps === null;
              const hasPr    = sets.some((s) => {
                if (!s.completed || s.weightKg === null) return false;
                const prev = prevMaxByExercise[s.exerciseId];
                return prev === undefined || s.weightKg > prev;
              });

              return (
                <div
                  key={exerciseName}
                  className="overflow-hidden rounded-2xl bg-white"
                  style={{ boxShadow: "0 2px 16px rgba(0,0,0,0.06), 0 1px 3px rgba(0,0,0,0.04)" }}
                >
                  {/* Card header */}
                  <div
                    className="flex items-center justify-between px-5 py-3.5"
                    style={{ background: "#F8FAFC", borderBottom: "1px solid #F1F5F9" }}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="flex h-9 w-9 items-center justify-center rounded-xl"
                        style={
                          isCardio
                            ? { background: "rgba(37,99,235,0.1)" }
                            : { background: "rgba(26,54,93,0.1)" }
                        }
                      >
                        {isCardio ? (
                          <Flame className="h-4 w-4 text-blue-500" />
                        ) : (
                          <Dumbbell className="h-4 w-4 text-[#1A365D]" />
                        )}
                      </div>
                      <div>
                        <p className="font-black text-slate-800 text-sm">{exerciseName}</p>
                        <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">
                          {isCardio ? "Kardiyo" : "Ağırlık"}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {hasPr && (
                        <span
                          className="flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-wider"
                          style={{ background: "rgba(251,191,36,0.15)", color: "#D97706" }}
                        >
                          <Award className="h-3 w-3" />
                          PR
                        </span>
                      )}
                      <span
                        className="rounded-full px-2.5 py-1 text-[10px] font-black"
                        style={{ background: "rgba(249,115,22,0.08)", color: "#EA580C" }}
                      >
                        {sets.length} set
                      </span>
                    </div>
                  </div>

                  {/* Set table */}
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead>
                        <tr style={{ borderBottom: "1px solid #F1F5F9" }}>
                          {["Set", "Ağırlık", "Tekrar", "RIR", "Durum"].map((h) => (
                            <th
                              key={h}
                              className="px-5 py-2.5 text-[10px] font-black uppercase tracking-wider text-slate-400"
                            >
                              {h}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {sets.map((set) => {
                          const isPrSet =
                            set.completed &&
                            set.weightKg !== null &&
                            (prevMaxByExercise[set.exerciseId] === undefined ||
                              set.weightKg > (prevMaxByExercise[set.exerciseId] ?? 0));

                          return (
                            <tr
                              key={set.id}
                              style={{ borderBottom: "1px solid #F8FAFC" }}
                              className="last:border-b-0"
                            >
                              <td className="px-5 py-3 text-sm font-black text-slate-500">
                                {set.setNumber}
                              </td>
                              <td className="px-5 py-3 text-sm font-black text-slate-800">
                                {set.weightKg != null ? (
                                  <span className="flex items-center gap-1.5">
                                    {set.weightKg} 
                                    {/* kg */}
                                    {isPrSet && (
                                      <span
                                        className="rounded-full px-1.5 py-0.5 text-[9px] font-black uppercase"
                                        style={{ background: "rgba(251,191,36,0.2)", color: "#B45309" }}
                                      >
                                        PR
                                      </span>
                                    )}
                                  </span>
                                ) : (
                                  <span className="text-slate-400">—</span>
                                )}
                              </td>
                              <td className="px-5 py-3 text-sm font-bold text-slate-700">
                                {set.reps ?? <span className="text-slate-400">—</span>}
                              </td>
                              <td className="px-5 py-3 text-sm text-slate-500">
                                {set.rir ?? <span className="text-slate-400">—</span>}
                              </td>
                              <td className="px-5 py-3 overflow-hidden">
                                {set.completed ? (
                                  <span
                                    className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-black"
                                    style={{ background: "rgba(34,197,94,0.1)", color: "#16A34A" }}
                                  >
                                    <CheckCircle2 className="h-3 w-3" />
                                    Tamam
                                  </span>
                                ) : (
                                  <span
                                    className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-black"
                                    style={{ background: "rgba(148,163,184,0.1)", color: "#94A3B8" }}
                                  >
                                    <XCircle className="h-3 w-3" />
                                    Atlandı
                                  </span>
                                )}
                              </td>
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
        </div>

        {/* ── RIGHT: Sidebar ── */}
        <div className="space-y-4">

          {/* Coach feedback */}
          <div
            className="rounded-2xl overflow-hidden"
            style={{ boxShadow: "0 2px 16px rgba(0,0,0,0.06), 0 1px 3px rgba(0,0,0,0.04)" }}
          >
            <div
              className="px-5 py-4"
              style={{ background: "linear-gradient(135deg, #1A365D, #2D4A7A)" }}
            >
              <div className="flex items-center gap-2 mb-3">
                <MessageSquare className="h-4 w-4 text-white/60" />
                <h3 className="text-[11px] font-black uppercase tracking-widest text-white/60">
                  Koç Yorumları
                </h3>
              </div>
              {workout.comments.length === 0 ? (
                <p className="text-sm text-white/50">Henüz koç değerlendirmesi yok.</p>
              ) : (
                <div className="space-y-3">
                  {workout.comments.slice(0, 3).map((c) => (
                    <div
                      key={c.id}
                      className="rounded-xl p-3"
                      style={{ background: "rgba(255,255,255,0.08)", borderLeft: "3px solid rgba(249,115,22,0.6)" }}
                    >
                      <p className="text-xs font-black text-white/50 mb-1">{c.author.name}</p>
                      <p className="text-sm leading-relaxed text-white/85">"{c.content}"</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Intensity scale */}
          {isCompleted && (
            <div
              className="rounded-2xl bg-white p-5"
              style={{ boxShadow: "0 2px 16px rgba(0,0,0,0.06), 0 1px 3px rgba(0,0,0,0.04)" }}
            >
              <div className="flex items-center gap-2 mb-4">
                <div
                  className="flex h-8 w-8 items-center justify-center rounded-xl"
                  style={{ background: "rgba(249,115,22,0.1)" }}
                >
                  <Zap className="h-4 w-4 text-orange-500" />
                </div>
                <h3 className="text-[11px] font-black uppercase tracking-widest text-slate-400">
                  Yoğunluk Skoru
                </h3>
              </div>
              <div className="flex flex-wrap gap-2">
                {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
                  <div
                    key={n}
                    className="flex h-9 w-9 items-center justify-center rounded-xl text-sm font-black"
                    style={
                      n === intensityScore
                        ? {
                            background: "linear-gradient(135deg, #FB923C, #EA580C)",
                            color: "#fff",
                            boxShadow: "0 4px 12px rgba(249,115,22,0.4)",
                            transform: "scale(1.1)",
                          }
                        : n < intensityScore
                        ? { background: "rgba(249,115,22,0.1)", color: "#EA580C" }
                        : { background: "#F8FAFC", color: "#CBD5E1" }
                    }
                  >
                    {n}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Nav buttons */}
          <div className="space-y-2">
            <Link
              href="/client/workouts"
              className="flex w-full items-center justify-center gap-2 rounded-2xl py-3.5 text-sm font-bold text-slate-500 transition-colors hover:text-slate-700"
              style={{ background: "#F8FAFC", border: "1px solid #E2E8F0" }}
            >
              <ChevronLeft className="h-4 w-4" />
              Geçmişe Dön
            </Link>
            <Link
              href="/client/dashboard"
              className="flex w-full items-center justify-center gap-2 rounded-2xl py-3.5 text-sm font-black text-white transition hover:opacity-90"
              style={{
                background: "linear-gradient(135deg, #FB923C, #EA580C)",
                boxShadow: "0 4px 14px rgba(249,115,22,0.35)",
              }}
            >
              {isCompleted ? (
                <><CheckCircle2 className="h-4 w-4" /> Dashboard'a Git</>
              ) : (
                <><Dumbbell className="h-4 w-4" /> Tekrar Dene</>
              )}
            </Link>
          </div>
        </div>
      </div>

      {/* ── Share card (full width) ── */}
      {isCompleted && (
        <WorkoutShareCard
          title={workout.template.name}
          durationMinutes={durationMin}
          totalVolumeKg={Math.round(totalVolumeKg)}
          prExerciseNames={prExerciseNames}
          workoutDate={workoutDate}
          totalSets={completedSets}
          exercises={Object.entries(setsByExercise)
              .sort(([a], [b]) => (exerciseOrderMap.get(a) ?? 999) - (exerciseOrderMap.get(b) ?? 999))
              .map(([name, sets]) => ({
              name,
              maxWeightKg: sets.reduce<number | null>((max, s) => {
                if (!s.completed || s.weightKg === null) return max;
                return max === null ? s.weightKg : Math.max(max, s.weightKg);
              }, null),
            }))}
          clientName={workout.client?.name ?? session.user.name ?? undefined}
          coachName={coachRelation?.coach.name ?? undefined}
        />
      )}
    </div>
  );
}

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
  Play,
  Trophy,
  Weight,
  XCircle,
  Zap,
} from "lucide-react";
// Zap used in stats array

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { WorkoutShareCard } from "@/components/client/WorkoutShareCard";
import { IntensityScoreWidget } from "@/components/client/IntensityScoreWidget";
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
      movementVideos: {
        include: {
          comments: {
            orderBy: { createdAt: "asc" },
            select: {
              id: true,
              content: true,
              createdAt: true,
              coach: { select: { name: true } },
            },
          },
        },
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

  // Use saved score if available, fallback to calculated
  const intensityScore =
    workout.intensityScore ??
    Math.min(10, Math.max(1, Math.round((completedSets / Math.max(workout.sets.length, 1)) * 10)));

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

  const sortedExercises = Object.entries(setsByExercise)
    .sort(([a], [b]) => (exerciseOrderMap.get(a) ?? 999) - (exerciseOrderMap.get(b) ?? 999));

  const shareCardProps = {
    title: workout.template.name,
    durationMinutes: durationMin,
    totalVolumeKg: Math.round(totalVolumeKg),
    prExerciseNames,
    workoutDate,
    totalSets: completedSets,
    exercises: sortedExercises.map(([name, sets]) => ({
      name,
      maxWeightKg: sets.reduce<number | null>((max, s) => {
        if (!s.completed || s.weightKg === null) return max;
        return max === null ? s.weightKg : Math.max(max, s.weightKg);
      }, null),
    })),
    clientName: workout.client?.name ?? session.user.name ?? undefined,
    coachName: coachRelation?.coach.name ?? undefined,
  };

  return (
    <div className="pb-16">

      {/* ── Back link ── */}
      <Link
        href="/client/workouts"
        className="mb-5 inline-flex items-center gap-1.5 text-xs font-bold text-slate-400 transition-colors hover:text-slate-700"
      >
        <ChevronLeft className="h-3.5 w-3.5" />
        Antrenman Geçmişi
      </Link>

      {/* ── Hero banner ── */}
      <div className="mb-6">
        <PageHero
          title={workout.template.name}
          subtitle={workoutDate.toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" })}
          glowColor={isCompleted ? "green" : "amber"}
          badge={isCompleted
            ? { label: "Tamamlandı",      color: "#22C55E", bg: "rgba(34,197,94,0.15)",  border: "rgba(34,197,94,0.25)",  icon: CheckCircle2 }
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
                {prExerciseNames.length} yeni PR — {prExerciseNames.slice(0, 3).join(", ")}
                {prExerciseNames.length > 3 ? ` +${prExerciseNames.length - 3}` : ""}
              </span>
            </div>
          )}
        </PageHero>
      </div>

      {/* ── Stat cards ── */}
      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {stats.map(({ icon: Icon, label, value, color, bg }) => (
          <div
            key={label}
            className="flex flex-col rounded-2xl bg-white p-4 sm:p-5"
            style={{ boxShadow: "0 2px 16px rgba(0,0,0,0.06), 0 1px 3px rgba(0,0,0,0.04)" }}
          >
            <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-xl" style={{ background: bg }}>
              <Icon className="h-4 w-4" style={{ color }} />
            </div>
            <p className="text-xl font-black text-slate-800 leading-none sm:text-2xl">{value}</p>
            <p className="mt-1.5 text-[10px] font-black uppercase tracking-wider text-slate-400">{label}</p>
          </div>
        ))}
      </div>

      {/* ── Main layout: left/right on lg+ ── */}
      <div className="flex flex-col gap-6 lg:flex-row lg:items-start">

        {/* ── LEFT: Exercise breakdown (grows to fill) ── */}
        <div className="flex-1 min-w-0 space-y-4">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl" style={{ background: "rgba(249,115,22,0.1)" }}>
              <Dumbbell className="h-4 w-4 text-orange-500" />
            </div>
            <h2 className="text-base font-black text-slate-800">Egzersiz Detayı</h2>
            <span className="rounded-full px-2.5 py-0.5 text-xs font-black" style={{ background: "rgba(249,115,22,0.1)", color: "#EA580C" }}>
              {sortedExercises.length}
            </span>
          </div>

          {sortedExercises.length === 0 ? (
            <div className="rounded-2xl bg-white p-8 text-center" style={{ boxShadow: "0 2px 16px rgba(0,0,0,0.06)" }}>
              <p className="text-sm text-slate-400">Bu antrenman için kayıtlı set bulunamadı.</p>
            </div>
          ) : (
            sortedExercises.map(([exerciseName, sets]) => {
              const isCardio = sets[0].weightKg === null && sets[0].reps === null;
              const hasPr = sets.some((s) => {
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
                  {/* Exercise header */}
                  <div className="flex items-center justify-between px-5 py-3.5" style={{ background: "#F8FAFC", borderBottom: "1px solid #F1F5F9" }}>
                    <div className="flex items-center gap-3">
                      <div
                        className="flex h-9 w-9 items-center justify-center rounded-xl"
                        style={isCardio ? { background: "rgba(37,99,235,0.1)" } : { background: "rgba(26,54,93,0.1)" }}
                      >
                        {isCardio ? <Flame className="h-4 w-4 text-blue-500" /> : <Dumbbell className="h-4 w-4 text-[#1A365D]" />}
                      </div>
                      <div>
                        <p className="font-black text-slate-800">{exerciseName}</p>
                        <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">
                          {isCardio ? "Kardiyo" : "Ağırlık"}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {hasPr && (
                        <span className="flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-wider" style={{ background: "rgba(251,191,36,0.15)", color: "#D97706" }}>
                          <Award className="h-3 w-3" /> PR
                        </span>
                      )}
                      <span className="rounded-full px-2.5 py-1 text-[10px] font-black" style={{ background: "rgba(249,115,22,0.08)", color: "#EA580C" }}>
                        {sets.length} set
                      </span>
                    </div>
                  </div>

                  {/* Set table */}
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead>
                        <tr style={{ borderBottom: "1px solid #F1F5F9" }}>
                          {["Set", "Ağırlık (kg)", "Tekrar", "RIR"].map((h) => (
                            <th key={h} className="px-5 py-2.5 text-[10px] font-black uppercase tracking-wider text-slate-400">{h}</th>
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
                            <tr key={set.id} style={{ borderBottom: "1px solid #F8FAFC" }} className="last:border-b-0">
                              <td className="px-5 py-3 text-sm font-black text-slate-500">{set.setNumber}</td>
                              <td className="px-5 py-3 text-sm font-black text-slate-800">
                                {set.weightKg != null ? (
                                  <span className="flex items-center gap-1.5">
                                    {set.weightKg}
                                    {isPrSet && (
                                      <span className="rounded-full px-1.5 py-0.5 text-[9px] font-black uppercase" style={{ background: "rgba(251,191,36,0.2)", color: "#B45309" }}>PR</span>
                                    )}
                                  </span>
                                ) : <span className="text-slate-400">—</span>}
                              </td>
                              <td className="px-5 py-3 text-sm font-bold text-slate-700">{set.reps ?? <span className="text-slate-400">—</span>}</td>
                              <td className="px-5 py-3 text-sm text-slate-500">{set.rir ?? <span className="text-slate-400">—</span>}</td>
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

        {/* ── RIGHT: Sidebar — sticky on desktop ── */}
        <div className="w-full space-y-4 lg:w-80 xl:w-96 lg:flex-shrink-0 lg:sticky lg:top-24 lg:self-start">

          {/* Coach comments */}
          <div className="rounded-2xl overflow-hidden" style={{ boxShadow: "0 2px 16px rgba(0,0,0,0.06), 0 1px 3px rgba(0,0,0,0.04)" }}>
            <div className="px-5 py-4" style={{ background: "linear-gradient(135deg, #1A365D, #2D4A7A)" }}>
              <div className="flex items-center gap-2 mb-3">
                <MessageSquare className="h-4 w-4 text-white/60" />
                <h3 className="text-[11px] font-black uppercase tracking-widest text-white/60">Koç Yorumları</h3>
              </div>
              {workout.comments.length === 0 ? (
                <p className="text-sm text-white/40">Henüz koç değerlendirmesi yok.</p>
              ) : (
                <div className="space-y-3">
                  {workout.comments.slice(0, 3).map((c) => (
                    <div key={c.id} className="rounded-xl p-3" style={{ background: "rgba(255,255,255,0.08)", borderLeft: "3px solid rgba(249,115,22,0.6)" }}>
                      <p className="text-xs font-black text-white/50 mb-1">{c.author.name}</p>
                      <p className="text-sm leading-relaxed text-white/85">"{c.content}"</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Intensity score widget */}
          {isCompleted && (
            <IntensityScoreWidget
              workoutId={workout.id}
              initialScore={workout.intensityScore ?? null}
            />
          )}

          {/* Share card — in sidebar on desktop */}
          {isCompleted && (
            <div className="hidden lg:block overflow-hidden">
              <WorkoutShareCard {...shareCardProps} />
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
              style={{ background: "linear-gradient(135deg, #FB923C, #EA580C)", boxShadow: "0 4px 14px rgba(249,115,22,0.35)" }}
            >
              {isCompleted ? <><CheckCircle2 className="h-4 w-4" /> Dashboard&apos;a Git</> : <><Dumbbell className="h-4 w-4" /> Tekrar Dene</>}
            </Link>
          </div>
        </div>
      </div>

      {/* Feedback section — Movement Videos */}
      {workout.movementVideos.length > 0 && (
        <div className="mt-8">
          <div className="flex items-center gap-2 mb-4">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl" style={{ background: "rgba(249,115,22,0.1)" }}>
              <Play className="h-4 w-4 text-orange-500" />
            </div>
            <h2 className="text-base font-black text-slate-800">Geri Bildirim</h2>
            <span className="rounded-full px-2.5 py-0.5 text-xs font-black" style={{ background: "rgba(249,115,22,0.1)", color: "#EA580C" }}>
              {workout.movementVideos.length} video
            </span>
          </div>

          <div className="space-y-3">
            {workout.movementVideos.map((video) => (
              <div
                key={video.id}
                className="rounded-2xl overflow-hidden bg-white"
                style={{ boxShadow: "0 2px 16px rgba(0,0,0,0.06), 0 1px 3px rgba(0,0,0,0.04)" }}
              >
                <div className="flex flex-col md:flex-row gap-4 p-4 md:p-5">
                  {/* Video Thumbnail */}
                  <div className="flex-shrink-0 w-full md:w-40">
                    <div className="relative aspect-video md:aspect-square rounded-lg bg-black overflow-hidden group cursor-pointer">
                      <video
                        src={video.videoPath}
                        className="w-full h-full object-cover"
                        preload="metadata"
                      />
                      <div className="absolute inset-0 bg-black/20 group-hover:bg-black/30 transition flex items-center justify-center opacity-0 group-hover:opacity-100">
                        <Play className="h-8 w-8 text-white" />
                      </div>
                    </div>
                  </div>

                  {/* Video Info and Comments */}
                  <div className="flex-1 min-w-0">
                    <div className="mb-3">
                      <p className="text-[10px] font-black uppercase tracking-wider text-slate-500">
                        {video.movementName}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        {new Date(video.createdAt).toLocaleDateString("tr-TR")} • {video.durationSeconds}s
                      </p>
                    </div>

                    {/* Comments */}
                    {video.comments.length === 0 ? (
                      <div className="text-xs text-slate-400 italic">
                        Henüz yorum yok. Koç görünce yorum yapacak.
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {video.comments.map((c) => (
                          <div
                            key={c.id}
                            className="rounded-lg p-3"
                            style={{ background: "rgba(249,115,22,0.08)", borderLeft: "2px solid rgba(249,115,22,0.3)" }}
                          >
                            <p className="text-[10px] font-bold text-slate-700 mb-1">
                              {c.coach.name}
                            </p>
                            <p className="text-xs leading-relaxed text-slate-700">
                              {c.content}
                            </p>
                            <p className="mt-1 text-[10px] text-slate-500">
                              {new Date(c.createdAt).toLocaleDateString("tr-TR", {
                                month: "short",
                                day: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Share card — full width on mobile */}
      {isCompleted && (
        <div className="mt-6 lg:hidden">
          <WorkoutShareCard {...shareCardProps} />
        </div>
      )}
    </div>
  );
}

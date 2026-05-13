import Link from "next/link";
import { CheckCircle2, ChevronRight, XCircle } from "lucide-react";
import { Prisma } from "@prisma/client";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { CheckInWidget } from "@/components/client/CheckInWidget";
import { BodyCheckInCard } from "@/components/client/BodyCheckInCard";
import { GoalsManager } from "@/components/shared/GoalsManager";
import { AchievementsPanel } from "@/components/client/AchievementsPanel";
import { PersonalRecordsPanel } from "@/components/client/PersonalRecordsPanel";
import { SessionsPanel } from "@/components/shared/SessionsPanel";
import { StreakWidget } from "@/components/client/StreakWidget";
import { ensureAchievementsSeeded } from "@/lib/achievements";

function Avatar({ name, size = 40, bg = "#1A365D" }: { name: string; size?: number; bg?: string }) {
  const initials = name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
  return (
    <div
      className="flex items-center justify-center rounded-full text-white font-bold shrink-0"
      style={{
        width: size,
        height: size,
        background: `linear-gradient(135deg, ${bg}, ${bg}cc)`,
        fontSize: size * 0.36,
        boxShadow: `0 2px 8px ${bg}44`,
      }}
    >
      {initials}
    </div>
  );
}

type DailyMobilityRoutine = {
  id: string;
  name: string;
  description: string | null;
  movements: Array<{
    id: string;
    durationSeconds: number;
    movement: {
      name: string;
      videoUrl: string | null;
    };
  }>;
};

function isMissingMobilityRoutineTableError(error: unknown) {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2021" &&
    error.meta?.modelName === "MobilityRoutine"
  );
}

export default async function ClientDashboardPage() {
  const session = await auth();
  const clientId = session?.user.id || "";
  const userName = session?.user.name || "Kullanıcı";

  // Seed built-in achievements once
  await ensureAchievementsSeeded().catch(() => {});

  const toDayKey = (date: Date) =>
    `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
  const today = new Date();
  const todayKey = toDayKey(today);

  const [
    assignments,
    inProgressWorkout,
    completedWorkoutCount,
    recentWorkouts,
    activeCoachCount,
    recentComments,
    commentCount,
  ] = await Promise.all([
    prisma.templateAssignment.findMany({
      where: { clientId },
      include: {
        template: {
          include: {
            exercises: {
              include: { exercise: true },
              orderBy: { order: "asc" },
            },
          },
        },
        workouts: { select: { status: true } },
      },
      orderBy: { scheduledFor: "asc" },
      take: 30,
    }),
    prisma.workout.findFirst({
      where: { clientId, status: "IN_PROGRESS" },
      select: { assignmentId: true },
      orderBy: { startedAt: "desc" },
    }),
    prisma.workout.count({ where: { clientId, status: "COMPLETED" } }),
    prisma.workout.findMany({
      where: { clientId },
      include: { template: true },
      orderBy: { startedAt: "desc" },
      take: 3,
    }),
    prisma.coachClientRelation.count({ where: { clientId, status: "ACCEPTED" } }),
    prisma.comment.findMany({
      where: { workout: { clientId }, author: { role: "COACH" } },
      include: { author: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
      take: 3,
    }),
    prisma.comment.count({
      where: { workout: { clientId }, author: { role: "COACH" } },
    }),
  ]);

  const primaryCoachRelation = await prisma.coachClientRelation.findFirst({
    where: { clientId, status: "ACCEPTED" },
    orderBy: { createdAt: "asc" },
    select: { coachId: true },
  });

  let dailyMobilityRoutines: DailyMobilityRoutine[] = [];
  if (primaryCoachRelation) {
    try {
      dailyMobilityRoutines = await prisma.mobilityRoutine.findMany({
        where: { coachId: primaryCoachRelation.coachId },
        orderBy: { createdAt: "asc" },
        take: 3,
        include: {
          movements: {
            orderBy: { order: "asc" },
            take: 5,
            select: {
              id: true,
              durationSeconds: true,
              movement: {
                select: {
                  name: true,
                  videoUrl: true,
                },
              },
            },
          },
        },
      });
    } catch (error) {
      if (!isMissingMobilityRoutineTableError(error)) {
        throw error;
      }
      dailyMobilityRoutines = [];
    }
  }

  const todaysAssignments = assignments.filter(
    (a) => toDayKey(new Date(a.scheduledFor)) === todayKey,
  );
  const upcomingAssignments = assignments
    .filter(
      (a) =>
        toDayKey(new Date(a.scheduledFor)) !== todayKey &&
        new Date(a.scheduledFor) >= today,
    )
    .slice(0, 3);

  const mondayStart = new Date(today);
  const weekDayOffset = (today.getDay() + 6) % 7;
  mondayStart.setDate(today.getDate() - weekDayOffset);
  mondayStart.setHours(0, 0, 0, 0);

  const weeklyFocusDays = Array.from({ length: 7 }, (_, index) => {
    const dayDate = new Date(mondayStart);
    dayDate.setDate(mondayStart.getDate() + index);
    const key = toDayKey(dayDate);
    const dayAssignments = assignments.filter(
      (a) => toDayKey(new Date(a.scheduledFor)) === key,
    );
    const hasCompleted = dayAssignments.some((a) =>
      a.workouts.some((w) => w.status === "COMPLETED"),
    );
    return {
      key,
      dayLabel: dayDate
        .toLocaleDateString("tr-TR", { weekday: "short" })
        .toUpperCase(),
      dayNumber: dayDate.getDate(),
      isToday: key === todayKey,
      hasCompleted,
      hasPlanned: dayAssignments.length > 0,
    };
  });

  const stats = [
    { label: "Tamamlanan", val: completedWorkoutCount.toString() },
    { label: "Aktif Koç", val: activeCoachCount.toString() },
    { label: "Bu Hafta", val: weeklyFocusDays.filter((d) => d.hasCompleted).length.toString() },
    { label: "Yorum", val: commentCount.toString() },
  ];

  return (
    <div className="min-h-screen">
      {/* ── Hero ── */}
      <div
        className="-mx-4 px-5 pt-5 pb-7 -mt-4"
        style={{ background: "linear-gradient(160deg, #1A365D, #2D4A7A)" }}
      >
        <div className="flex items-center justify-between mb-5">
          <div>
            <p className="text-white/60 text-[13px] m-0">Merhaba,</p>
            <h2 className="text-white text-[22px] font-black m-0 leading-tight">
              {userName} 👋
            </h2>
          </div>
        </div>
        <div className="grid grid-cols-4 gap-2.5">
          {stats.map((stat) => (
            <div
              key={stat.label}
              className="rounded-xl py-2.5 px-2 text-center"
              style={{ background: "rgba(255,255,255,0.1)" }}
            >
              <div className="text-[20px] font-extrabold text-white leading-none">
                {stat.val}
              </div>
              <div className="text-[10px] text-white/60 mt-1 leading-tight">
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Content ── */}
      <div className="mt-4 flex flex-col gap-5">

        {/* ① BUGÜNÜN ANTRENMANı — ekrana ilk sığan şey bu olmalı */}
        <div>
          <div className="flex items-center justify-between mb-2.5">
            <span className="text-[15px] font-bold text-slate-800">Bugünün Antrenmanı</span>
            <Link href="/client/calendar" className="text-[12px] text-orange-500 font-semibold">
              Takvim →
            </Link>
          </div>

          {todaysAssignments.length === 0 ? (
            <div
              className="bg-white rounded-[18px] p-5 shadow-sm text-center"
              style={{ border: "1px solid rgba(0,0,0,0.06)" }}
            >
              <div className="text-3xl mb-2">😴</div>
              <p className="text-slate-500 text-[13px] font-semibold m-0">Bugün dinlenme günü.</p>
              <Link
                href="/client/workouts"
                className="mt-3 inline-flex items-center gap-1 text-[12px] text-orange-500 font-bold"
              >
                Geçmiş antrenmanlar →
              </Link>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {todaysAssignments.map((assignment) => {
                const isCompleted = assignment.workouts.some((w) => w.status === "COMPLETED");
                const isInProgress =
                  assignment.workouts.some((w) => w.status === "IN_PROGRESS") ||
                  inProgressWorkout?.assignmentId === assignment.id;
                const btnLabel = isCompleted ? "✓ Tamamlandı" : isInProgress ? "Devam Et" : "Başla";
                const btnGrad = isCompleted
                  ? "linear-gradient(135deg, #22C55E, #16A34A)"
                  : "linear-gradient(135deg, #FB923C, #EA580C)";

                return (
                  <div
                    key={assignment.id}
                    className="bg-white rounded-[18px] shadow-sm overflow-hidden"
                    style={{ border: "1px solid rgba(0,0,0,0.06)" }}
                  >
                    {/* Accent bar */}
                    <div
                      className="h-1.5 w-full"
                      style={{ background: isCompleted ? "#22C55E" : "linear-gradient(90deg,#FB923C,#EA580C)" }}
                    />
                    <div className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span
                              className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                              style={{
                                background: isCompleted ? "#DCFCE7" : "rgba(249,115,22,0.1)",
                                color: isCompleted ? "#16A34A" : "#F97316",
                              }}
                            >
                              {isCompleted ? "✓ Bugün" : isInProgress ? "⚡ Devam Ediyor" : "Bugün"}
                            </span>
                          </div>
                          <h3 className="text-[18px] font-black text-slate-800 leading-tight">
                            {assignment.template.name}
                          </h3>
                          <p className="text-[12px] text-slate-400 mt-0.5">
                            {assignment.template.exercises.length} egzersiz
                          </p>
                        </div>
                        <Link
                          href={`/client/workout/${assignment.id}/start`}
                          className="shrink-0 ml-3 rounded-2xl px-5 py-3 text-[14px] font-black text-white shadow-md active:scale-95 transition-transform"
                          style={{
                            background: btnGrad,
                            boxShadow: isCompleted
                              ? "0 4px 12px rgba(34,197,94,0.4)"
                              : "0 4px 12px rgba(234,88,12,0.4)",
                          }}
                        >
                          {btnLabel}
                        </Link>
                      </div>
                      <div className="flex gap-2 flex-wrap">
                        {assignment.template.exercises.slice(0, 5).map((ex, i) => (
                          <span
                            key={i}
                            className="bg-slate-100 rounded-lg px-2.5 py-1 text-[11px] text-slate-600 font-medium"
                          >
                            {ex.exercise.name}
                            {ex.targetSets && ex.targetReps
                              ? ` ${ex.targetSets}×${ex.targetReps}`
                              : ex.durationMinutes
                                ? ` ${ex.durationMinutes}dk`
                                : ""}
                          </span>
                        ))}
                        {assignment.template.exercises.length > 5 && (
                          <span className="bg-slate-100 rounded-lg px-2.5 py-1 text-[11px] text-slate-500 font-medium">
                            +{assignment.template.exercises.length - 5}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ② STREAK — motivasyon, kısa, above fold'a sığar */}
        <StreakWidget />

        {/* ③ HAFTALIK TAKVİM — haftanın durumu */}
        <div
          className="bg-white rounded-[18px] p-4 shadow-sm"
          style={{ border: "1px solid rgba(0,0,0,0.06)" }}
        >
          <Link href="/client/calendar" className="flex items-center justify-between mb-4">
            <h3 className="text-[15px] font-bold text-slate-800">Haftanın Planı</h3>
            <span className="text-[12px] text-orange-500 font-semibold">Takvim →</span>
          </Link>
          <div className="flex items-center justify-between">
            {weeklyFocusDays.map((day) => (
              <div key={day.key} className="flex flex-col items-center gap-1.5">
                <span className={`text-[10px] font-bold ${day.isToday ? "text-slate-800" : "text-slate-400"}`}>
                  {day.dayLabel}
                </span>
                <div
                  className={`flex h-9 w-9 items-center justify-center rounded-xl text-[11px] font-black ${
                    day.hasCompleted
                      ? "bg-orange-500 text-white"
                      : day.isToday
                        ? "border-2 border-orange-500 bg-white text-orange-500"
                        : day.hasPlanned
                          ? "bg-slate-100 text-slate-700"
                          : "bg-slate-50 text-slate-300"
                  }`}
                >
                  {day.hasCompleted ? "✓" : day.dayNumber}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ④ KOÇTAN GELEN YORUMLAR — zaman hassasiyeti yüksek */}
        {recentComments.length > 0 && (
          <div>
            <span className="text-[15px] font-bold text-slate-800 block mb-2.5">Koç Yorumları</span>
            <div className="flex flex-col gap-2">
              {recentComments.map((c) => (
                <div
                  key={c.id}
                  className="bg-white rounded-[18px] shadow-sm p-3.5"
                  style={{ border: "1px solid rgba(0,0,0,0.06)", borderLeft: "3px solid #2563EB" }}
                >
                  <p className="text-[13px] text-slate-600 mb-2 leading-relaxed m-0">{c.content}</p>
                  <div className="flex items-center gap-1.5">
                    <Avatar name={c.author.name} size={20} bg="#1A365D" />
                    <span className="text-[12px] text-slate-400 font-semibold">{c.author.name}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ⑤ CHECK-IN & VÜCUT TAKİP — günlük aksiyon */}
        <CheckInWidget />
        <BodyCheckInCard />

        {/* ⑥ YAKLAŞAN SEANSLAR */}
        <SessionsPanel role="CLIENT" />

        {/* ⑦ BESLENME */}
        <Link
          href="/client/nutrition/log"
          className="block rounded-[20px] p-4 text-white shadow-sm transition hover:opacity-95"
          style={{
            background: "linear-gradient(135deg, #F97316, #EA580C)",
            boxShadow: "0 8px 24px rgba(234,88,12,0.28)",
          }}
        >
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.18em] text-white/75">Beslenme Takibi</p>
              <h3 className="mt-1 text-[22px] font-black leading-tight">📸 Öğün Kaydet</h3>
              <p className="mt-1 text-xs font-semibold text-white/80">Kamerayı aç, etiketi seç, koçuna ilet.</p>
            </div>
            <div className="rounded-full bg-white/20 px-4 py-2 text-[12px] font-black uppercase">Aç</div>
          </div>
        </Link>

        {/* ⑧ HEDEFLER */}
        <GoalsManager />

        {/* ⑨ KİŞİSEL REKORLAR + BAŞARIMLAR */}
        <PersonalRecordsPanel />
        <AchievementsPanel />

        {/* ⑩ YAKLAŞAN ANTRENMANLAR */}
        {upcomingAssignments.length > 0 && (
          <div>
            <span className="text-[15px] font-bold text-slate-800 block mb-2.5">Yaklaşan</span>
            <div className="flex flex-col gap-2">
              {upcomingAssignments.map((a) => (
                <div
                  key={a.id}
                  className="bg-white rounded-[18px] shadow-sm p-3.5 flex items-center gap-3"
                  style={{ border: "1px solid rgba(0,0,0,0.06)" }}
                >
                  <div className="bg-slate-100 rounded-xl px-3 py-2 text-center shrink-0 min-w-[48px]">
                    <div className="text-[11px] text-slate-400 font-medium leading-none">
                      {new Date(a.scheduledFor).toLocaleDateString("tr-TR", { month: "short" })}
                    </div>
                    <div className="text-[18px] font-black text-slate-700 leading-tight">
                      {new Date(a.scheduledFor).getDate()}
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[14px] font-bold text-slate-800 truncate">{a.template.name}</div>
                    <div className="text-[12px] text-slate-400">{a.template.exercises.length} egzersiz</div>
                  </div>
                  <span className="bg-slate-100 text-slate-400 text-[10px] font-bold px-2 py-1 rounded-full shrink-0">
                    Yaklaşıyor
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ⑪ MOBİLİTE */}
        {dailyMobilityRoutines.length > 0 && (
          <div className="rounded-[18px] bg-white p-4 shadow-sm" style={{ border: "1px solid rgba(0,0,0,0.06)" }}>
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-[15px] font-bold text-slate-800">Günlük Mobilite</h3>
              <span className="rounded-full bg-emerald-50 px-2 py-1 text-[10px] font-bold uppercase text-emerald-600">
                Rutin
              </span>
            </div>
            <div className="space-y-2.5">
              {dailyMobilityRoutines.map((routine) => (
                <div key={routine.id} className="rounded-xl border border-slate-100 bg-slate-50 p-3">
                  <p className="text-sm font-bold text-slate-800">{routine.name}</p>
                  {routine.description && (
                    <p className="mt-0.5 text-xs text-slate-500">{routine.description}</p>
                  )}
                  <div className="mt-2 space-y-1.5">
                    {routine.movements.map((item) => (
                      <div key={item.id} className="flex items-center justify-between text-xs">
                        <span className="text-slate-700">{item.movement.name}</span>
                        <span className="font-semibold text-slate-500">{item.durationSeconds} sn</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ⑫ FORM ANALİZİ */}
        <Link
          href="/client/form-analysis"
          className="block rounded-[18px] border border-blue-200 bg-blue-50 p-4 transition hover:bg-blue-100"
        >
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.18em] text-blue-600">Form Analizi</p>
              <p className="mt-1 text-sm font-bold text-blue-900">Video yükle, sorunu yaz, koçuna gönder.</p>
            </div>
            <span className="rounded-full bg-blue-600 px-3 py-1 text-xs font-black text-white">Gönder</span>
          </div>
        </Link>

        {/* ⑬ SON ANTRENMANLAR */}
        <div>
          <div className="flex items-center justify-between mb-2.5">
            <span className="text-[15px] font-bold text-slate-800">Son Antrenmanlar</span>
            <Link href="/client/workouts" className="text-[12px] text-orange-500 font-semibold">
              Tümü →
            </Link>
          </div>
          {recentWorkouts.length === 0 ? (
            <div
              className="bg-white rounded-[18px] p-4 shadow-sm text-center text-[13px] text-slate-400"
              style={{ border: "1px solid rgba(0,0,0,0.06)" }}
            >
              Henüz antrenman yok.
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {recentWorkouts.map((w) => {
                const durationMin = w.finishedAt
                  ? Math.round((new Date(w.finishedAt).getTime() - new Date(w.startedAt).getTime()) / 60000)
                  : null;
                return (
                  <Link
                    key={w.id}
                    href={`/client/workouts/${w.id}`}
                    className="bg-white rounded-[18px] shadow-sm p-3.5 flex items-center gap-3"
                    style={{ border: "1px solid rgba(0,0,0,0.06)" }}
                  >
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                        w.status === "COMPLETED" ? "bg-green-500/15" : "bg-amber-500/15"
                      }`}
                    >
                      {w.status === "COMPLETED" ? (
                        <CheckCircle2 className="h-5 w-5 text-green-500" />
                      ) : (
                        <XCircle className="h-5 w-5 text-amber-500" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-[14px] font-bold text-slate-800 truncate">{w.template.name}</div>
                      <div className="text-[12px] text-slate-400">
                        {new Date(w.startedAt).toLocaleDateString("tr-TR")}
                        {durationMin ? ` · ${durationMin} dk` : ""}
                      </div>
                    </div>
                    <ChevronRight className="h-4 w-4 text-slate-300 shrink-0" />
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

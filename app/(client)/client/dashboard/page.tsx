import Link from "next/link";
import { Check, List, NotebookText, Play, Plus, TrendingDown, TrendingUp } from "lucide-react";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { getCurrentDayStart } from "@/lib/current-date";

export default async function ClientDashboardPage() {
  const session = await auth();
  const clientId = session?.user.id || "";

  const [assignments, workouts, comments, relations, inProgressWorkout, completedWorkoutCount, unreadMessageCount, totalCommentCount, recentSets] = await Promise.all([
    prisma.templateAssignment.findMany({
      where: { clientId },
      include: {
        template: {
          include: {
            exercises: {
              include: {
                exercise: true
              },
              orderBy: {
                order: "asc"
              }
            }
          }
        },
        workouts: {
          select: { status: true }
        }
      },
      orderBy: { createdAt: "desc" }
    }),
    prisma.workout.findMany({
      where: { clientId, status: { in: ["COMPLETED", "ABANDONED"] } },
      include: { template: true },
      orderBy: { startedAt: "desc" },
      take: 6
    }),
    prisma.comment.findMany({
      where: { workout: { clientId } },
      include: { author: true },
      orderBy: { createdAt: "desc" },
      take: 4
    }),
    prisma.coachClientRelation.findMany({
      where: { clientId, status: "ACCEPTED" },
      include: { coach: true },
      orderBy: { createdAt: "desc" }
    }),
    prisma.workout.findFirst({
      where: { clientId, status: "IN_PROGRESS" },
      include: { template: true },
      orderBy: { startedAt: "desc" }
    }),
    prisma.workout.count({
      where: { clientId, status: "COMPLETED" }
    }),
    prisma.message.count({
      where: { receiverId: clientId, isRead: false }
    }),
    prisma.comment.count({
      where: { workout: { clientId } }
    })
    ,
    prisma.workoutSet.findMany({
      where: {
        workout: { clientId }
      },
      include: {
        workout: {
          select: { startedAt: true }
        }
      },
      orderBy: { workout: { startedAt: "desc" } },
      take: 250
    })
  ]);

  const today = getCurrentDayStart();

  const assignmentItems = assignments.map((assignment: (typeof assignments)[number]) => {
    const scheduledFor = new Date(assignment.scheduledFor);
    scheduledFor.setHours(0, 0, 0, 0);

    const isConsumed = assignment.isOneTime && assignment.workouts.some((workout: { status: "IN_PROGRESS" | "COMPLETED" | "ABANDONED" }) =>
      workout.status === "COMPLETED" || workout.status === "ABANDONED"
    );

    return {
      ...assignment,
      isToday: scheduledFor.toDateString() === today.toDateString(),
      isPast: scheduledFor.getTime() < today.getTime(),
      isConsumed
    };
  }).filter((assignment: { isPast: boolean; isConsumed: boolean }) => !assignment.isPast && !assignment.isConsumed);

  

  const todayAssignments = assignmentItems.filter((assignment: DashboardAssignment) => assignment.isToday);
  const todaySession = inProgressWorkout ?? null;

  const startOfWeek = new Date(today);
  const dayOffset = (startOfWeek.getDay() + 6) % 7;
  startOfWeek.setDate(startOfWeek.getDate() - dayOffset);

  const weekSlots = Array.from({ length: 6 }).map((_, index) => {
    const d = new Date(startOfWeek);
    d.setDate(startOfWeek.getDate() + index);
    return d;
  });

  const completedDayKeys = new Set(
    workouts
      .filter((workout) => workout.status === "COMPLETED")
      .map((workout) => {
        const d = new Date(workout.startedAt);
        return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
      })
  );

  const fallbackTodayAssignment = todayAssignments[0];

  const volumeByDay = weekSlots.map((day) => {
    const key = `${day.getFullYear()}-${day.getMonth()}-${day.getDate()}`;
    const dayVolume = recentSets.reduce((total, set) => {
      const started = new Date(set.workout.startedAt);
      const setKey = `${started.getFullYear()}-${started.getMonth()}-${started.getDate()}`;
      if (setKey !== key) return total;
      return total + (set.weightKg ?? 0) * (set.reps ?? 0);
    }, 0);
    return dayVolume;
  });

  const maxVolume = Math.max(...volumeByDay, 1);
  const latestWeightSet = recentSets.find((set) => typeof set.weightKg === "number" && set.weightKg > 0);
  const currentWeight = latestWeightSet?.weightKg ?? 0;
  const weeklyVolumeTons = (volumeByDay.reduce((sum, value) => sum + value, 0) / 1000).toFixed(1);
  const nutritionProgress = 75;

  const dayNames = ["MON", "TUE", "WED", "THU", "FRI", "SAT"];

  type DashboardAssignment = (typeof assignmentItems)[number];

  const latestComments = comments.slice(0, 2);

  return (
    <div className="space-y-8 pb-8">
      <section className="space-y-1">
        <h1 className="leading-none tracking-tighter text-4xl font-black text-slate-900">
          PUSH FOR <br /> <span className="italic text-orange-600">PRECISION</span>
        </h1>
        <p className="text-sm font-medium text-slate-500">{completedWorkoutCount} sessions down. The goal is in sight.</p>
      </section>

      <section className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="font-bold tracking-tight text-slate-900">Weekly Focus</h2>
          <span className="text-[10px] font-bold uppercase tracking-widest text-orange-600">{new Date().toLocaleDateString("en-US", { month: "long" })}</span>
        </div>
        <div className="flex items-center justify-between text-center">
          {weekSlots.map((day, index) => {
            const key = `${day.getFullYear()}-${day.getMonth()}-${day.getDate()}`;
            const isToday = day.toDateString() === today.toDateString();
            const isCompleted = completedDayKeys.has(key);

            return (
              <div key={key} className="flex flex-col items-center space-y-2">
                <span className={`text-[10px] ${isToday ? "font-bold text-slate-900" : "text-slate-400"}`}>{dayNames[index]}</span>
                {isCompleted ? (
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-600 text-white">
                    <Check className="h-4 w-4" />
                  </div>
                ) : isToday ? (
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl border-2 border-orange-600 text-sm font-black text-orange-600">
                    {day.getDate()}
                  </div>
                ) : (
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100">
                    <div className="h-1.5 w-1.5 rounded-full bg-slate-300" />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      <section className="relative min-h-[300px] overflow-hidden rounded-2xl bg-slate-950 p-6 text-white shadow-xl">
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/30 to-transparent" />
        <div className="relative z-10 space-y-4">
          <div className="inline-flex items-center rounded-sm bg-orange-600 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-white">Today's Session</div>
          <div className="space-y-1">
            <h3 className="text-3xl font-black uppercase leading-none tracking-tighter">
              {todaySession ? todaySession.template.name : fallbackTodayAssignment ? fallbackTodayAssignment.template.name : "Recovery Day"}
            </h3>
            <p className="text-sm text-slate-400">
              {todaySession
                ? "Focus: Active workout in progress"
                : fallbackTodayAssignment
                  ? "Focus: Assigned template ready"
                  : "Focus: New assignment bekleniyor"}
            </p>
          </div>
          <div className="flex gap-4 text-xs font-bold uppercase tracking-widest text-slate-300">
            <span className="flex items-center gap-1">
              <NotebookText className="h-4 w-4" /> {assignmentItems.length} TASKS
            </span>
            <span className="flex items-center gap-1">
              <List className="h-4 w-4" /> {workouts.length} SESSIONS
            </span>
          </div>
          <Link
            href={todaySession ? `/client/workout/${todaySession.assignmentId}/start` : fallbackTodayAssignment ? `/client/workout/${fallbackTodayAssignment.id}/start` : "/client/workouts"}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-orange-600 py-4 text-lg font-black uppercase tracking-tight text-white transition-all hover:bg-orange-700"
          >
            START WORKOUT
            <Play className="h-5 w-5" />
          </Link>
        </div>
      </section>

      <section className="grid grid-cols-2 gap-4">
        <div className="flex h-40 flex-col justify-between rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
          <div className="flex items-start justify-between">
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Weight</span>
            <TrendingDown className="h-4 w-4 text-slate-400" />
          </div>
          <div className="space-y-1">
            <div className="text-2xl font-black text-slate-900">{currentWeight.toFixed(1)}<span className="ml-1 text-xs text-slate-400">KG</span></div>
            <div className="flex h-12 items-end gap-1">
              {volumeByDay.map((value, index) => (
                <div
                  key={`${value}-${index}`}
                  className={`w-full rounded-t-sm ${index === volumeByDay.length - 1 ? "bg-orange-200" : "bg-slate-100"}`}
                  style={{ height: `${Math.max(Math.round((value / maxVolume) * 100), 16)}%` }}
                />
              ))}
            </div>
          </div>
        </div>
        <div className="flex h-40 flex-col justify-between rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
          <div className="flex items-start justify-between">
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Volume</span>
            <TrendingUp className="h-4 w-4 text-orange-600" />
          </div>
          <div className="space-y-1">
            <div className="text-2xl font-black text-slate-900">{weeklyVolumeTons}<span className="ml-1 text-xs text-slate-400">T</span></div>
            <div className="flex h-12 items-end gap-1">
              {volumeByDay.map((value, index) => (
                <div
                  key={`${value}-v-${index}`}
                  className={`w-full rounded-t-sm ${index === volumeByDay.length - 1 ? "bg-orange-600" : "bg-slate-100"}`}
                  style={{ height: `${Math.max(Math.round((value / maxVolume) * 100), 16)}%` }}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="flex items-center justify-between rounded-2xl bg-slate-900 p-6 text-white shadow-lg">
        <div className="space-y-3">
          <h4 className="font-bold">Nutrition Status</h4>
          <div className="flex items-center gap-3">
            <div className="relative flex h-12 w-12 items-center justify-center">
              <svg className="h-full w-full -rotate-90" viewBox="0 0 48 48" fill="none">
                <circle cx="24" cy="24" r="20" stroke="currentColor" strokeWidth="4" className="text-slate-800" />
                <circle
                  cx="24"
                  cy="24"
                  r="20"
                  stroke="currentColor"
                  strokeWidth="4"
                  className="text-orange-500"
                  strokeDasharray="125"
                  strokeDashoffset={String(125 - (nutritionProgress / 100) * 125)}
                />
              </svg>
              <span className="absolute text-[10px] font-black text-white">{nutritionProgress}%</span>
            </div>
            <div className="flex flex-col">
              <span className="text-xs font-bold">Tracking yakinda</span>
              <span className="text-[10px] text-slate-400">Beslenme log modulu henuz aktif degil</span>
            </div>
          </div>
        </div>
        <button type="button" className="rounded-full bg-orange-600 p-3 text-white transition-transform active:scale-95" aria-label="add nutrition">
          <Plus className="h-5 w-5" />
        </button>
      </section>

      <section className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
        <div className="mb-3 flex items-center justify-between">
          <h4 className="font-bold text-slate-900">Coach Notes</h4>
          <Link href="/client/messages" className="text-xs font-bold text-orange-600 hover:underline">
            Message Center ({unreadMessageCount})
          </Link>
        </div>
        {latestComments.length === 0 ? (
          <p className="text-sm text-slate-500">Henüz coach notu yok.</p>
        ) : (
          <div className="space-y-2">
            {latestComments.map((comment) => (
              <div key={comment.id} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                <p className="text-sm text-slate-700">{comment.content}</p>
                <p className="mt-1 text-xs text-slate-500">{comment.author.name}</p>
              </div>
            ))}
          </div>
        )}

        <div className="mt-4 grid grid-cols-2 gap-3">
          <Link href="/client/coaches" className="rounded-xl border border-slate-200 p-3 text-sm font-semibold text-slate-700 transition-colors hover:border-orange-200 hover:text-orange-600">
            Coach Network ({relations.length})
          </Link>
          <Link href="/client/workouts" className="rounded-xl border border-slate-200 p-3 text-sm font-semibold text-slate-700 transition-colors hover:border-orange-200 hover:text-orange-600">
            Workout Library
          </Link>
          <div className="rounded-xl border border-slate-200 p-3 text-sm font-semibold text-slate-700">Comments: {totalCommentCount}</div>
          <div className="rounded-xl border border-slate-200 p-3 text-sm font-semibold text-slate-700">Completed: {completedWorkoutCount}</div>
        </div>
      </section>
    </div>
  );
}

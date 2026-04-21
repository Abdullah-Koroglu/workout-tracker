import Link from "next/link";
import { ArrowRight, CalendarDays, CheckCircle2, Play, Zap } from "lucide-react";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function ClientDashboardPage() {
  const session = await auth();
  const clientId = session?.user.id || "";

  const [assignments, inProgressWorkout, completedWorkoutCount, recentWorkouts] = await Promise.all([
    prisma.templateAssignment.findMany({
      where: { clientId },
      include: {
        template: {
          include: {
            exercises: {
              include: { exercise: true },
              orderBy: { order: "asc" }
            }
          }
        },
        workouts: { select: { status: true } }
      },
      orderBy: { scheduledFor: "asc" },
      take: 6
    }),
    prisma.workout.findFirst({
      where: { clientId, status: "IN_PROGRESS" },
      include: { template: true },
      orderBy: { startedAt: "desc" }
    }),
    prisma.workout.count({ where: { clientId, status: "COMPLETED" } }),
    prisma.workout.findMany({
      where: { clientId },
      include: { template: true },
      orderBy: { startedAt: "desc" },
      take: 6
    })
  ]);

  const fallbackAssignment = assignments[0] || null;
  const targetWorkoutName = inProgressWorkout?.template.name || fallbackAssignment?.template.name || "Dinlenme Gunu";
  const targetWorkoutHref = inProgressWorkout
    ? `/client/workout/${inProgressWorkout.assignmentId}/start`
    : fallbackAssignment
      ? `/client/workout/${fallbackAssignment.id}/start`
      : "/client/workouts";

  const upcoming = assignments.slice(0, 3);
  const loadScore = Math.min(95, Math.max(40, completedWorkoutCount * 8));
  const hrvScore = Math.min(90, Math.max(40, completedWorkoutCount * 6));

  return (
    <div className="space-y-8 pb-8">
      <section className="space-y-2">
        <h2 className="text-4xl font-black uppercase tracking-tight text-on-surface md:text-5xl">HEDEFE ODAKLAN</h2>
        <p className="text-lg font-medium text-secondary">{completedWorkoutCount} seans tamamlandi. Hedef artik cok yakin.</p>
      </section>

      <section className="relative overflow-hidden rounded-xl bg-secondary text-on-tertiary shadow-xl">
        <div className="absolute inset-0 z-10 bg-gradient-to-br from-secondary/90 via-secondary/70 to-transparent" />
        <div className="relative z-20 space-y-6 p-8">
          <div className="space-y-1">
            <span className="text-[10px] font-label uppercase tracking-[0.2em] opacity-80">Bugunun Seansi</span>
            <h3 className="text-3xl font-extrabold leading-none tracking-tighter">{targetWorkoutName.toUpperCase()}</h3>
          </div>

          <div className="flex items-center gap-6">
            <div className="flex flex-col">
              <span className="text-xs font-label uppercase tracking-widest opacity-70">Gorev</span>
              <span className="text-lg font-bold">{assignments.length} PLAN</span>
            </div>
            <div className="h-8 w-px bg-on-tertiary/20" />
            <div className="flex flex-col">
              <span className="text-xs font-label uppercase tracking-widest opacity-70">Tamamlanan</span>
              <span className="text-lg font-bold">{completedWorkoutCount} SEANS</span>
            </div>
          </div>

          <Link
            href={targetWorkoutHref}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-primary to-primary-container px-8 py-4 text-lg font-bold uppercase tracking-widest text-white shadow-lg transition-transform active:scale-[0.98]"
          >
            ANTRENMANI BASLAT
            <Play className="h-5 w-5" />
          </Link>
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex items-end justify-between">
          <h3 className="text-xl font-bold tracking-tight text-secondary">Yaklasan Plan</h3>
          <Link href="/client/calendar" className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-primary">
            Tum Takvim <CalendarDays className="h-4 w-4" />
          </Link>
        </div>

        <div className="space-y-3">
          {upcoming.length === 0 ? (
            <div className="rounded-lg bg-surface-container-low p-4 text-sm text-on-surface-variant">Yaklaşan atama bulunmuyor.</div>
          ) : (
            upcoming.map((assignment) => (
              <Link
                key={assignment.id}
                href="/client/calendar"
                className="group flex cursor-pointer items-center gap-4 rounded-lg bg-surface-container-low p-4 transition-colors active:bg-surface-container-high"
              >
                <div className="flex min-w-[3.5rem] flex-col items-center justify-center rounded-lg bg-surface-container-highest py-2">
                  <span className="text-[10px] font-bold uppercase text-secondary/60">
                    {new Date(assignment.scheduledFor).toLocaleDateString("tr-TR", { weekday: "short" })}
                  </span>
                  <span className="text-xl font-black text-secondary">{new Date(assignment.scheduledFor).getDate()}</span>
                </div>
                <div className="flex-1">
                  <h4 className="font-bold text-secondary">{assignment.template.name}</h4>
                  <p className="text-sm font-medium text-on-surface-variant">
                    {assignment.template.exercises.length} egzersiz • {assignment.workouts.some((w) => w.status === "COMPLETED") ? "Tamamlandi" : "Planli"}
                  </p>
                </div>
                <div className="rounded-full bg-primary/10 px-3 py-1 text-[10px] font-bold uppercase text-primary">
                  {assignment.workouts.some((w) => w.status === "COMPLETED") ? "Bitti" : "Bekliyor"}
                </div>
              </Link>
            ))
          )}
        </div>
      </section>

      <section className="grid grid-cols-2 gap-4">
        <div className="rounded-lg border-l-4 border-primary bg-white p-6 shadow-sm">
          <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Yuk Skoru</span>
          <div className="mt-1 flex items-baseline gap-1">
            <span className="text-3xl font-black text-secondary">{loadScore}</span>
            <span className="text-xs font-bold text-slate-400">/100</span>
          </div>
        </div>
        <div className="rounded-lg border-l-4 border-tertiary bg-white p-6 shadow-sm">
          <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">HRV Durumu</span>
          <div className="mt-1 flex items-baseline gap-1">
            <span className="text-3xl font-black text-secondary">{hrvScore}</span>
            <span className="text-xs font-bold text-slate-400">ms</span>
          </div>
        </div>
      </section>

      <section className="rounded-lg bg-on-surface p-6 text-surface">
        <h3 className="relative z-10 text-lg font-black tracking-tight">HAFTALIK ODAK</h3>
        <div className="relative z-10 mt-4 space-y-4">
          <div className="flex items-end justify-between">
            <span className="text-[10px] font-bold uppercase tracking-widest opacity-60">Toplam Stres</span>
            <span className="text-2xl font-black text-primary-container">{300 + completedWorkoutCount * 20} <span className="text-xs">TSS</span></span>
          </div>
          <div className="h-1 w-full overflow-hidden rounded-full bg-surface/10">
            <div className="h-full bg-primary-container" style={{ width: `${Math.min(95, 40 + completedWorkoutCount * 8)}%` }} />
          </div>
          <p className="text-[10px] leading-relaxed opacity-70">Toparlanma için bu gece uyku ve beslenme rutininizi koruyun.</p>
        </div>
      </section>

      <section className="space-y-2">
        <h3 className="text-sm font-black tracking-tight text-secondary">Son Seanslar</h3>
        {recentWorkouts.length === 0 ? (
          <div className="rounded-lg bg-surface-container-low p-4 text-sm text-on-surface-variant">Henüz geçmiş seans yok.</div>
        ) : (
          recentWorkouts.slice(0, 2).map((workout) => (
            <div key={workout.id} className="flex items-center gap-3 rounded-lg bg-surface-container-low p-4">
              <CheckCircle2 className="h-5 w-5 text-primary" />
              <div className="flex-1">
                <p className="text-sm font-semibold text-on-surface">{workout.template.name}</p>
                <p className="text-xs text-secondary">{new Date(workout.startedAt).toLocaleString("tr-TR")}</p>
              </div>
              <Zap className="h-4 w-4 text-tertiary" />
            </div>
          ))
        )}
      </section>

      <section className="grid grid-cols-2 gap-3">
        <Link href="/client/calendar" className="rounded-xl border border-slate-200 p-3 text-sm font-semibold text-slate-700 transition-colors hover:border-orange-200 hover:text-orange-600">
          Takvim Plani
        </Link>
        <Link href="/client/workouts" className="rounded-xl border border-slate-200 p-3 text-sm font-semibold text-slate-700 transition-colors hover:border-orange-200 hover:text-orange-600">
          Antreman Arsivi
        </Link>
        <Link href="/client/coaches" className="rounded-xl border border-slate-200 p-3 text-sm font-semibold text-slate-700 transition-colors hover:border-orange-200 hover:text-orange-600">
          Koc Agi
        </Link>
        <Link href="/client/messages" className="inline-flex items-center justify-between rounded-xl border border-slate-200 p-3 text-sm font-semibold text-slate-700 transition-colors hover:border-orange-200 hover:text-orange-600">
          Mesajlar <ArrowRight className="h-4 w-4" />
        </Link>
      </section>
    </div>
  );
}

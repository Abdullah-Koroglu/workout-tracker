import Link from "next/link";
import { ArrowRight, CalendarClock, MessageSquare, PlayCircle, ShieldCheck, Users } from "lucide-react";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { getCurrentDayStart } from "@/lib/current-date";

export default async function ClientDashboardPage() {
  const session = await auth();
  const clientId = session?.user.id || "";

  const [assignments, workouts, comments, relations, inProgressWorkout] = await Promise.all([
    prisma.templateAssignment.findMany({
      where: { clientId },
      include: {
        template: true,
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
    })
  ]);

  const today = getCurrentDayStart();

  const assignmentItems = assignments.map((assignment) => {
    const scheduledFor = new Date(assignment.scheduledFor);
    scheduledFor.setHours(0, 0, 0, 0);

    const isConsumed = assignment.isOneTime && assignment.workouts.some((workout) =>
      workout.status === "COMPLETED" || workout.status === "ABANDONED"
    );

    return {
      ...assignment,
      isToday: scheduledFor.toDateString() === today.toDateString(),
      isPast: scheduledFor.getTime() < today.getTime(),
      isConsumed
    };
  }).filter((assignment) => !assignment.isPast && !assignment.isConsumed);

  

  const todayAssignments = assignmentItems.filter((assignment) => assignment.isToday);
  const upcomingAssignments = assignmentItems.filter((assignment) => !assignment.isToday);

  type DashboardAssignment = (typeof assignmentItems)[number];

const groupAssignmentsByDate = (items: DashboardAssignment[]) => {
  return items.reduce<Record<string, DashboardAssignment[]>>((acc, assignment) => {
    
    const d = new Date(assignment.scheduledFor);
    const dateKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

    if (!acc[dateKey]) acc[dateKey] = [];
    acc[dateKey].push(assignment);
    return acc;
  }, {} as Record<string, DashboardAssignment[]>);
};

  const renderCalendarGroups = (items: DashboardAssignment[], showStartButton: boolean) => {
    const groups = groupAssignmentsByDate(items);
    const keys = Object.keys(groups).sort((a, b) => a.localeCompare(b));

    return (
      <div className="space-y-4">
        {keys.map((dateKey) => {
          const date = new Date(dateKey);
          const dayItems = groups[dateKey] || [];

          return (
            <div key={dateKey} className="rounded-2xl border bg-card p-4 shadow-sm">
              <div className="mb-3 flex items-center justify-between border-b pb-2">
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-700">
                  {date.toLocaleDateString("tr-TR", { weekday: "long" })}
                </p>
                <p className="text-lg font-black text-foreground">
                  {date.toLocaleDateString("tr-TR", { day: "2-digit", month: "long" })}
                </p>
              </div>

              <div className="space-y-2">
                {dayItems.map((assignment) => (
                  <div key={assignment.id} className="flex items-center justify-between gap-3 rounded-xl border p-3">
                    <div>
                      <p className="text-base font-bold text-foreground">{assignment.template.name}</p>
                      <p className="text-xs text-muted-foreground">
                        Atama: {new Date(assignment.createdAt).toLocaleDateString("tr-TR")}
                      </p>
                    </div>
                    {showStartButton ? (
                      <Link href={`/client/workout/${assignment.id}/start`} className="inline-flex rounded-full bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700">
                        Basla
                      </Link>
                    ) : (
                      <span className="inline-flex rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground">
                        Gunu gelmedi
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="space-y-8">
      <section className="overflow-hidden rounded-[32px] border border-emerald-200/60 bg-gradient-to-br from-emerald-50 via-white to-lime-50 p-6 shadow-sm">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-emerald-700">Client Command Center</p>
            <h1 className="text-3xl font-black tracking-tight text-slate-900 sm:text-4xl">Her şey tek akışta</h1>
            <p className="max-w-2xl text-sm text-slate-600">
              Aktif antrenmana dön, coach bağlantılarını yönet, yeni atanan programları başlat ve geçmiş performansını tek ekrandan takip et.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-4">
            <div className="rounded-2xl bg-white px-4 py-3 shadow-sm">
              <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Aktif Coach</p>
              <p className="mt-2 text-3xl font-black text-slate-900">{relations.length}</p>
            </div>
            <div className="rounded-2xl bg-white px-4 py-3 shadow-sm">
              <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Atanmış Plan</p>
              <p className="mt-2 text-3xl font-black text-slate-900">{assignments.length}</p>
            </div>
            <div className="rounded-2xl bg-white px-4 py-3 shadow-sm">
              <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Tamamlanan</p>
              <p className="mt-2 text-3xl font-black text-slate-900">{workouts.length}</p>
            </div>
            <div className="rounded-2xl bg-white px-4 py-3 shadow-sm">
              <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Yorum</p>
              <p className="mt-2 text-3xl font-black text-slate-900">{comments.length}</p>
            </div>
          </div>
        </div>

        <div className="mt-6 grid gap-3 md:grid-cols-3">
          <Link href={inProgressWorkout ? `/client/workout/${inProgressWorkout.assignmentId}/start` : "/client/workouts"} className="rounded-3xl bg-emerald-600 p-5 text-white shadow-sm transition hover:bg-emerald-700">
            <div className="flex items-center justify-between">
              <PlayCircle className="h-6 w-6" />
              <ArrowRight className="h-5 w-5" />
            </div>
            <p className="mt-6 text-lg font-bold">{inProgressWorkout ? "Aktif antrenmana dön" : "Geçmiş antrenmanlara git"}</p>
            <p className="mt-2 text-sm text-emerald-50">
              {inProgressWorkout ? inProgressWorkout.template.name : "Tamamlanan tüm antrenmanlarını listele."}
            </p>
          </Link>
          <Link href="/client/coaches" className="rounded-3xl border bg-white p-5 shadow-sm transition hover:border-emerald-300 hover:bg-emerald-50/60">
            <Users className="h-6 w-6 text-emerald-600" />
            <p className="mt-6 text-lg font-bold text-slate-900">Coach bağlantılarını yönet</p>
            <p className="mt-2 text-sm text-slate-600">Yeni coach ara, bekleyen ilişkileri kontrol et.</p>
          </Link>
          <Link href="/client/workouts" className="rounded-3xl border bg-white p-5 shadow-sm transition hover:border-emerald-300 hover:bg-emerald-50/60">
            <CalendarClock className="h-6 w-6 text-emerald-600" />
            <p className="mt-6 text-lg font-bold text-slate-900">Detaylı geçmiş</p>
            <p className="mt-2 text-sm text-slate-600">Set detayları ve coach yorumlarıyla tüm geçmişi aç.</p>
          </Link>
        </div>
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold">Atanmış Template'ler</h2>
          <Link href="/client/workouts" className="text-sm font-medium text-emerald-700 hover:text-emerald-900">Geçmişi aç</Link>
        </div>
        {assignmentItems.length === 0 ? (
          <div className="rounded-xl border border-dashed p-6 text-sm text-muted-foreground">
            Bugün veya gelecekte atanmış aktif template yok.
          </div>
        ) : (
          <div className="space-y-6">
            <div>
              <h3 className="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-emerald-700">Bugün</h3>
              {todayAssignments.length === 0 ? (
                <div className="rounded-2xl border border-dashed p-4 text-sm text-muted-foreground">Bugüne atanmış template yok.</div>
              ) : (
                renderCalendarGroups(todayAssignments, true)
              )}
            </div>

            <div>
              <h3 className="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-slate-600">Gelecek</h3>
              {upcomingAssignments.length === 0 ? (
                <div className="rounded-2xl border border-dashed p-4 text-sm text-muted-foreground">Gelecek günler için template yok.</div>
              ) : (
                renderCalendarGroups(upcomingAssignments, false)
              )}
            </div>
          </div>
        )}
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">Son Antrenmanlar</h2>
            <Link href="/client/workouts" className="text-sm font-medium text-emerald-700 hover:text-emerald-900">Tümünü gör</Link>
          </div>
        {workouts.length === 0 ? (
          <div className="rounded-xl border border-dashed p-6 text-sm text-muted-foreground">
            Henüz tamamlanmış antrenman yok.
          </div>
        ) : (
            <div className="space-y-3">
              {workouts.map((workout) => (
                <Link key={workout.id} href={`/client/workouts/${workout.id}`} className="flex items-center justify-between rounded-3xl border bg-card p-4 shadow-sm transition hover:border-emerald-300 hover:bg-emerald-50/40">
                  <div>
                    <p className="font-semibold text-foreground">{workout.template.name}</p>
                    <p className="mt-1 text-sm text-muted-foreground">{new Date(workout.startedAt).toLocaleDateString("tr-TR")}</p>
                  </div>
                  <ArrowRight className="h-5 w-5 text-muted-foreground" />
                </Link>
              ))}
            </div>
        )}
        </div>

        <div className="space-y-3">
          <h2 className="font-semibold">Coach Yorumları</h2>
        {comments.length === 0 ? (
          <div className="rounded-xl border border-dashed p-6 text-sm text-muted-foreground">
            Henüz coach yorumu yok.
          </div>
        ) : (
            comments.map((comment) => (
              <div key={comment.id} className="rounded-3xl border bg-card p-4 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <MessageSquare className="mt-1 h-5 w-5 text-emerald-600" />
                  <div className="flex-1">
                    <p className="text-sm text-foreground">{comment.content}</p>
                    <p className="mt-2 text-xs text-muted-foreground">{comment.author.name}</p>
                  </div>
                </div>
              </div>
            ))
        )}
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <div className="rounded-3xl border bg-card p-5 shadow-sm">
          <Users className="h-6 w-6 text-emerald-600" />
          <p className="mt-4 text-lg font-bold">Bağlı coachlar</p>
          <p className="mt-2 text-sm text-muted-foreground">{relations.length > 0 ? relations.map((relation) => relation.coach.name).join(", ") : "Henüz kabul edilmiş coach yok."}</p>
        </div>
      </section>
    </div>
  );
}

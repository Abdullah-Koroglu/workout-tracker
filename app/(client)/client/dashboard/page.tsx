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
      <div className="space-y-3 md:space-y-4">
        {keys.map((dateKey) => {
          const date = new Date(dateKey);
          const dayItems = groups[dateKey] || [];

          return (
            <div key={dateKey} className="rounded-2xl border bg-card p-3 shadow-sm md:p-4">
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2 border-b pb-2">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700 md:text-sm md:tracking-[0.2em]">
                  {date.toLocaleDateString("tr-TR", { weekday: "long" })}
                </p>
                <p className="text-base font-black text-foreground md:text-lg">
                  {date.toLocaleDateString("tr-TR", { day: "2-digit", month: "long" })}
                </p>
              </div>

              <div className="space-y-2">
                {dayItems.map((assignment) => {
                  const weightItems = assignment.template.exercises.filter((item) => item.exercise.type === "WEIGHT");
                  const cardioItems = assignment.template.exercises.filter((item) => item.exercise.type === "CARDIO");

                  return (
                    <div key={assignment.id} className="rounded-xl border p-3 md:p-4">
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between sm:gap-3">
                        <div className="min-w-0">
                          <p className="line-clamp-2 text-sm font-bold text-foreground sm:text-base">{assignment.template.name}</p>
                          <p className="text-[11px] text-muted-foreground md:text-xs">
                            Atama: {new Date(assignment.createdAt).toLocaleDateString("tr-TR")}
                          </p>
                        </div>
                        {showStartButton ? (
                          <Link href={`/client/workout/${assignment.id}/start`} className="inline-flex w-full items-center justify-center rounded-full bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 sm:w-auto">
                            Basla
                          </Link>
                        ) : (
                          <span className="inline-flex w-fit rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground">
                            Gunu gelmedi
                          </span>
                        )}
                      </div>

                      <div className="mt-3 grid gap-2 md:grid-cols-2 md:gap-3">
                        <div className="rounded-lg bg-slate-50 p-2">
                          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-600">Agirlik ({weightItems.length})</p>
                          <div className="mt-1 space-y-1">
                            {weightItems.length === 0 ? (
                              <p className="text-xs text-muted-foreground">Yok</p>
                            ) : (
                              weightItems.map((item) => (
                                <p key={item.id} className="text-xs text-slate-700">
                                  {item.exercise.name}: {item.targetSets ?? "-"}x{item.targetReps ?? "-"} RIR {item.targetRir ?? "-"}
                                </p>
                              ))
                            )}
                          </div>
                        </div>
                        <div className="rounded-lg bg-orange-50 p-2">
                          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-orange-700">Kardiyo ({cardioItems.length})</p>
                          <div className="mt-1 space-y-1">
                            {cardioItems.length === 0 ? (
                              <p className="text-xs text-muted-foreground">Yok</p>
                            ) : (
                              cardioItems.map((item) => (
                                <p key={item.id} className="text-xs text-orange-900">
                                  {item.exercise.name}: {item.durationMinutes ?? 1} dk / {(item.protocol as unknown[] | null)?.length ?? 0} blok
                                </p>
                              ))
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="space-y-6 md:space-y-8">
      <section className="overflow-hidden rounded-2xl border border-emerald-200/60 bg-gradient-to-br from-emerald-50 via-white to-lime-50 p-4 shadow-sm md:rounded-[32px] md:p-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-3">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-emerald-700 md:text-xs md:tracking-[0.25em]">Client Command Center</p>
            <h1 className="text-2xl font-black tracking-tight text-slate-900 sm:text-3xl md:text-4xl">Her şey tek akışta</h1>
            <p className="max-w-2xl text-xs text-slate-600 sm:text-sm">
              Aktif antrenmana dön, coach bağlantılarını yönet, yeni atanan programları başlat ve geçmiş performansını tek ekrandan takip et.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-3">
            <div className="rounded-2xl bg-white px-3 py-2.5 shadow-sm md:px-4 md:py-3">
              <p className="text-[10px] uppercase tracking-[0.14em] text-slate-500 md:text-xs md:tracking-[0.18em]">Aktif Coach</p>
              <p className="mt-1 text-2xl font-black text-slate-900 md:mt-2 md:text-3xl">{relations.length}</p>
            </div>
            <div className="rounded-2xl bg-white px-3 py-2.5 shadow-sm md:px-4 md:py-3">
              <p className="text-[10px] uppercase tracking-[0.14em] text-slate-500 md:text-xs md:tracking-[0.18em]">Atanmış Plan</p>
              <p className="mt-1 text-2xl font-black text-slate-900 md:mt-2 md:text-3xl">{assignments.length}</p>
            </div>
            <div className="rounded-2xl bg-white px-3 py-2.5 shadow-sm md:px-4 md:py-3">
              <p className="text-[10px] uppercase tracking-[0.14em] text-slate-500 md:text-xs md:tracking-[0.18em]">Tamamlanan</p>
              <p className="mt-1 text-2xl font-black text-slate-900 md:mt-2 md:text-3xl">{workouts.length}</p>
            </div>
            <div className="rounded-2xl bg-white px-3 py-2.5 shadow-sm md:px-4 md:py-3">
              <p className="text-[10px] uppercase tracking-[0.14em] text-slate-500 md:text-xs md:tracking-[0.18em]">Yorum</p>
              <p className="mt-1 text-2xl font-black text-slate-900 md:mt-2 md:text-3xl">{comments.length}</p>
            </div>
          </div>
        </div>

        <div className="mt-4 grid gap-3 md:mt-6 md:grid-cols-3">
          <Link href={inProgressWorkout ? `/client/workout/${inProgressWorkout.assignmentId}/start` : "/client/workouts"} className="rounded-2xl bg-emerald-600 p-4 text-white shadow-sm transition hover:bg-emerald-700 md:rounded-3xl md:p-5">
            <div className="flex items-center justify-between">
              <PlayCircle className="h-6 w-6" />
              <ArrowRight className="h-5 w-5" />
            </div>
            <p className="mt-4 text-base font-bold md:mt-6 md:text-lg">{inProgressWorkout ? "Aktif antrenmana dön" : "Geçmiş antrenmanlara git"}</p>
            <p className="mt-1 text-xs text-emerald-50 md:mt-2 md:text-sm">
              {inProgressWorkout ? inProgressWorkout.template.name : "Tamamlanan tüm antrenmanlarını listele."}
            </p>
          </Link>
          <Link href="/client/coaches" className="rounded-2xl border bg-white p-4 shadow-sm transition hover:border-emerald-300 hover:bg-emerald-50/60 md:rounded-3xl md:p-5">
            <Users className="h-6 w-6 text-emerald-600" />
            <p className="mt-4 text-base font-bold text-slate-900 md:mt-6 md:text-lg">Coach bağlantılarını yönet</p>
            <p className="mt-1 text-xs text-slate-600 md:mt-2 md:text-sm">Yeni coach ara, bekleyen ilişkileri kontrol et.</p>
          </Link>
          <Link href="/client/workouts" className="rounded-2xl border bg-white p-4 shadow-sm transition hover:border-emerald-300 hover:bg-emerald-50/60 md:rounded-3xl md:p-5">
            <CalendarClock className="h-6 w-6 text-emerald-600" />
            <p className="mt-4 text-base font-bold text-slate-900 md:mt-6 md:text-lg">Detaylı geçmiş</p>
            <p className="mt-1 text-xs text-slate-600 md:mt-2 md:text-sm">Set detayları ve coach yorumlarıyla tüm geçmişi aç.</p>
          </Link>
        </div>
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-between gap-2">
          <h2 className="font-semibold">Atanmış Template'ler</h2>
          <Link href="/client/workouts" className="text-sm font-medium text-emerald-700 hover:text-emerald-900">Geçmişi aç</Link>
        </div>
        {assignmentItems.length === 0 ? (
          <div className="rounded-xl border border-dashed p-6 text-sm text-muted-foreground">
            Bugün veya gelecekte atanmış aktif template yok.
          </div>
        ) : (
          <div className="space-y-5 md:space-y-6">
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

      <section className="grid gap-4 md:gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="space-y-3">
          <div className="flex items-center justify-between gap-2">
            <h2 className="font-semibold">Son Antrenmanlar</h2>
            <Link href="/client/workouts" className="text-sm font-medium text-emerald-700 hover:text-emerald-900">Tümünü gör</Link>
          </div>
        {workouts.length === 0 ? (
          <div className="rounded-xl border border-dashed p-6 text-sm text-muted-foreground">
            Henüz tamamlanmış antrenman yok.
          </div>
        ) : (
            <div className="space-y-2.5 md:space-y-3">
              {workouts.map((workout) => (
                <Link key={workout.id} href={`/client/workouts/${workout.id}`} className="flex items-center justify-between gap-3 rounded-2xl border bg-card p-3 shadow-sm transition hover:border-emerald-300 hover:bg-emerald-50/40 md:rounded-3xl md:p-4">
                  <div className="min-w-0">
                    <p className="line-clamp-1 font-semibold text-foreground">{workout.template.name}</p>
                    <p className="mt-1 text-xs text-muted-foreground md:text-sm">{new Date(workout.startedAt).toLocaleDateString("tr-TR")}</p>
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
              <div key={comment.id} className="rounded-2xl border bg-card p-3 shadow-sm md:rounded-3xl md:p-4">
                <div className="flex items-start justify-between gap-3">
                  <MessageSquare className="mt-1 h-5 w-5 text-emerald-600" />
                  <div className="flex-1">
                    <p className="text-sm text-foreground md:text-sm">{comment.content}</p>
                    <p className="mt-2 text-xs text-muted-foreground">{comment.author.name}</p>
                  </div>
                </div>
              </div>
            ))
        )}
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl border bg-card p-4 shadow-sm md:rounded-3xl md:p-5">
          <Users className="h-6 w-6 text-emerald-600" />
          <p className="mt-3 text-base font-bold md:mt-4 md:text-lg">Bağlı coachlar</p>
          <p className="mt-2 text-sm text-muted-foreground">{relations.length > 0 ? relations.map((relation) => relation.coach.name).join(", ") : "Henüz kabul edilmiş coach yok."}</p>
        </div>
      </section>
    </div>
  );
}

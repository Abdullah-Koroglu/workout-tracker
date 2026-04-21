import Link from "next/link";
import { CalendarDays, ChevronRight, ClipboardList, MessageSquareText, Trophy } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export default async function ClientWorkoutsPage() {
  const session = await auth();
  if (!session || session.user.role !== "CLIENT") {
    return null;
  }

  const workouts = await prisma.workout.findMany({
    where: {
      clientId: session.user.id,
      status: { in: ["COMPLETED", "ABANDONED"] },
    },
    include: {
      template: {
        select: {
          name: true,
        },
      },
      sets: true,
      comments: true,
    },
    orderBy: {
      finishedAt: "desc",
    },
  });

  const grouped = workouts.reduce<Record<string, typeof workouts>>((acc, workout) => {
    const d = workout.finishedAt ?? workout.startedAt;
    const key = d.toLocaleDateString("tr-TR", { month: "long", year: "numeric" });
    if (!acc[key]) acc[key] = [];
    acc[key].push(workout);
    return acc;
  }, {});

  const completedCount = workouts.filter((workout) => workout.status === "COMPLETED").length;
  const abandonedCount = workouts.filter((workout) => workout.status === "ABANDONED").length;

  if (workouts.length === 0) {
    return (
      <div className="space-y-4">
        <section className="overflow-hidden rounded-xl bg-gradient-to-br from-card via-muted/20 to-background p-4 shadow-sm ring-1 ring-black/5 md:p-6">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-primary md:text-xs">Performance History</p>
          <h1 className="mt-2 text-2xl font-black tracking-tight text-slate-900 md:text-3xl">Antrenman Geçmişi</h1>
          <p className="mt-2 text-xs text-slate-600 md:text-sm">Tamamlanan ve yarıda bırakılan tüm antrenmanlarını buradan takip et.</p>
        </section>
        <div className="rounded-xl bg-muted/40 p-8 text-center">
          <p className="text-muted-foreground">
            Henüz tamamlanan antrenman bulunmamaktadır
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 md:space-y-5">
      <section className="overflow-hidden rounded-xl bg-gradient-to-br from-card via-muted/20 to-background p-4 shadow-sm ring-1 ring-black/5 md:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-primary md:text-xs">Performance History</p>
            <h1 className="mt-2 text-2xl font-black tracking-tight text-slate-900 md:text-3xl">Antrenman Geçmişi</h1>
            <p className="mt-2 text-xs text-slate-600 md:text-sm">Set ve yorum detaylarıyla eski antrenmanlarını incele.</p>
          </div>
          <div className="grid grid-cols-3 gap-2 sm:w-auto">
            <div className="rounded-lg bg-background px-3 py-2 shadow-sm ring-1 ring-black/5">
              <p className="text-[10px] uppercase tracking-[0.14em] text-slate-500">Toplam</p>
              <p className="mt-1 text-lg font-black text-slate-900">{workouts.length}</p>
            </div>
            <div className="rounded-lg bg-background px-3 py-2 shadow-sm ring-1 ring-black/5">
              <p className="text-[10px] uppercase tracking-[0.14em] text-slate-500">Tamam</p>
              <p className="mt-1 text-lg font-black text-secondary">{completedCount}</p>
            </div>
            <div className="rounded-lg bg-background px-3 py-2 shadow-sm ring-1 ring-black/5">
              <p className="text-[10px] uppercase tracking-[0.14em] text-slate-500">Yarıda</p>
              <p className="mt-1 text-lg font-black text-primary">{abandonedCount}</p>
            </div>
          </div>
        </div>
      </section>

      <div className="space-y-6">
        {Object.entries(grouped).map(([month, monthWorkouts]) => (
          <section key={month} className="space-y-2.5 md:space-y-3">
            <h2 className="text-sm font-black uppercase tracking-[0.18em] text-muted-foreground">{month}</h2>

            {monthWorkouts.map((workout) => {
              const date = workout.finishedAt
                ? new Date(workout.finishedAt).toLocaleDateString("tr-TR")
                : new Date(workout.startedAt).toLocaleDateString("tr-TR");

              const setCount = workout.sets.length;
              const commentCount = workout.comments.length;
              const hasPr = workout.sets.some((s) => s.completed && s.weightKg !== null && s.reps !== null);

              return (
                <Link
                  key={workout.id}
                  href={`/client/workouts/${workout.id}`}
                  className="group block rounded-xl bg-card p-3.5 shadow-sm ring-1 ring-black/5 transition-all hover:-translate-y-0.5 hover:shadow-md md:p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <h3 className="line-clamp-2 text-base font-semibold text-gray-900 md:text-lg group-hover:text-primary">
                        {workout.template.name}
                      </h3>
                      <div className="mt-1 inline-flex items-center gap-1 text-xs text-muted-foreground md:text-sm">
                        <CalendarDays className="h-3.5 w-3.5" />
                        {date}
                      </div>
                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        <p className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold md:text-xs ${workout.status === "ABANDONED" ? "bg-primary/15 text-foreground" : "bg-secondary/20 text-secondary"}`}>
                          {workout.status === "ABANDONED" ? "Yarıda bırakıldı" : "Tamamlandı"}
                        </p>
                        {hasPr ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-primary/15 px-2.5 py-1 text-[11px] font-bold text-foreground">
                            <Trophy className="h-3 w-3" />
                            PR
                          </span>
                        ) : null}
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <ChevronRight className="h-5 w-5 text-slate-400" />
                      <div className="grid grid-cols-2 gap-2">
                        <div className="rounded-md bg-muted/50 px-2 py-1.5 text-right">
                          <p className="inline-flex items-center justify-end gap-1 text-[11px] text-muted-foreground">
                            <ClipboardList className="h-3 w-3" />
                            Set
                          </p>
                          <p className="text-sm font-semibold text-foreground md:text-base">{setCount}</p>
                        </div>
                        <div className="rounded-md bg-muted/50 px-2 py-1.5 text-right">
                          <p className="inline-flex items-center justify-end gap-1 text-[11px] text-muted-foreground">
                            <MessageSquareText className="h-3 w-3" />
                            Yorum
                          </p>
                          <p className="text-sm font-semibold text-foreground md:text-base">{commentCount}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </section>
        ))}
      </div>
    </div>
  );
}

import Link from "next/link";
import { CheckCircle2, ChevronRight, Clock, Dumbbell, MessageSquare, Trophy, XCircle } from "lucide-react";

import { PageHero } from "@/components/shared/PageHero";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function ClientWorkoutsPage() {
  const session = await auth();
  if (!session || session.user.role !== "CLIENT") return null;

  const workouts = await prisma.workout.findMany({
    where: {
      clientId: session.user.id,
      status: { in: ["COMPLETED", "ABANDONED"] },
    },
    include: {
      template: { select: { name: true } },
      sets: true,
      comments: true,
    },
    orderBy: { finishedAt: "desc" },
  });

  const grouped = workouts.reduce<Record<string, typeof workouts>>((accumulator, workout) => {
    const workoutDate = workout.finishedAt ?? workout.startedAt;
    const key = workoutDate.toLocaleDateString("tr-TR", { month: "long", year: "numeric" });
    if (!accumulator[key]) accumulator[key] = [];
    accumulator[key].push(workout);
    return accumulator;
  }, {});

  const completedCount = workouts.filter((workout) => workout.status === "COMPLETED").length;
  const abandonedCount = workouts.filter((workout) => workout.status === "ABANDONED").length;

  if (workouts.length === 0) {
    return (
      <div className="space-y-6 pb-[calc(var(--app-mobile-nav-height)+2rem)] md:pb-10">
        <PageHero
          eyebrow="Performans Gecmisi"
          title="Antrenman Gecmisi"
          subtitle="Tamamlanan ve yarida birakilan antrenmanlar burada gorunur."
        />

        <div
          className="rounded-2xl bg-white p-10 text-center"
          style={{ boxShadow: "0 2px 16px rgba(0,0,0,0.06), 0 1px 3px rgba(0,0,0,0.04)" }}
        >
          <div
            className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl"
            style={{ background: "rgba(249,115,22,0.08)" }}
          >
            <Dumbbell className="h-7 w-7 text-orange-300" />
          </div>
          <p className="font-bold text-slate-700">Henuz tamamlanan antrenman yok</p>
          <p className="mt-1 text-sm text-slate-400">Ilk antrenmanini tamamladiginda burada gorunecek.</p>
          <Link
            href="/client/dashboard"
            className="mt-5 inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-black text-white transition hover:opacity-90"
            style={{
              background: "linear-gradient(135deg, #FB923C, #EA580C)",
              boxShadow: "0 4px 14px rgba(249,115,22,0.3)",
            }}
          >
            Antrenmana Git
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-[calc(var(--app-mobile-nav-height)+2rem)] md:pb-10">
      <PageHero
        eyebrow="Performans Gecmisi"
        title="Antrenman Gecmisi"
        stats={[
          { label: "Toplam", value: workouts.length, color: "#2563EB", bg: "rgba(37,99,235,0.15)" },
          { label: "Tamamlanan", value: completedCount, color: "#22C55E", bg: "rgba(34,197,94,0.15)" },
          { label: "Yarida", value: abandonedCount, color: "#F59E0B", bg: "rgba(245,158,11,0.15)" },
        ]}
      />

      <div className="space-y-8">
        {Object.entries(grouped).map(([month, monthWorkouts]) => (
          <section key={month} className="space-y-3">
            <div className="flex items-center gap-3">
              <h2 className="text-[11px] font-black capitalize tracking-widest text-slate-400">{month}</h2>
              <span
                className="rounded-full px-2.5 py-0.5 text-[10px] font-black"
                style={{ background: "rgba(249,115,22,0.1)", color: "#EA580C" }}
              >
                {monthWorkouts.length}
              </span>
              <div className="h-px flex-1 bg-slate-100" />
            </div>

            <div className="flex flex-col gap-3">
              {monthWorkouts.map((workout) => {
                const isCompleted = workout.status === "COMPLETED";
                const date = (workout.finishedAt ?? workout.startedAt).toLocaleDateString("tr-TR", {
                  day: "numeric",
                  month: "short",
                });
                const setCount = workout.sets.length;
                const commentCount = workout.comments.length;
                const duration = workout.finishedAt
                  ? Math.max(1, Math.round((workout.finishedAt.getTime() - workout.startedAt.getTime()) / 60000))
                  : null;

                return (
                  <Link
                    key={workout.id}
                    href={`/client/workouts/${workout.id}`}
                    className="group overflow-hidden rounded-2xl border border-slate-200 bg-white p-4 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg"
                    style={{ boxShadow: "0 2px 16px rgba(0,0,0,0.06), 0 1px 3px rgba(0,0,0,0.04)" }}
                  >
                    <div
                      className="mb-4 h-1.5 w-full rounded-full"
                      style={{ background: isCompleted ? "rgba(34,197,94,0.18)" : "rgba(245,158,11,0.18)" }}
                    >
                      <div
                        className="h-full rounded-full"
                        style={{ width: "28%", background: isCompleted ? "#22C55E" : "#F59E0B" }}
                      />
                    </div>

                    <div className="flex items-start justify-between gap-3">
                      <div className="flex min-w-0 items-start gap-3">
                        <div
                          className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl"
                          style={{
                            background: isCompleted ? "rgba(34,197,94,0.1)" : "rgba(245,158,11,0.1)",
                          }}
                        >
                          {isCompleted ? (
                            <CheckCircle2 className="h-5 w-5 text-green-500" />
                          ) : (
                            <XCircle className="h-5 w-5 text-amber-500" />
                          )}
                        </div>

                        <div className="min-w-0">
                          <p className="truncate font-black text-slate-800 transition-colors group-hover:text-orange-600">
                            {workout.template.name}
                          </p>
                          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-400">
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {date}
                              {duration ? ` · ${duration} dk` : ""}
                            </span>
                            <span className="flex items-center gap-1">
                              <Dumbbell className="h-3 w-3" />
                              {setCount} set
                            </span>
                            {commentCount > 0 ? (
                              <span className="flex items-center gap-1 text-blue-400">
                                <MessageSquare className="h-3 w-3" />
                                {commentCount} yorum
                              </span>
                            ) : null}
                          </div>
                        </div>
                      </div>

                      <span
                        className="shrink-0 rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-wider"
                        style={
                          isCompleted
                            ? { background: "rgba(34,197,94,0.1)", color: "#16A34A" }
                            : { background: "rgba(245,158,11,0.1)", color: "#D97706" }
                        }
                      >
                        {isCompleted ? "Tamamlandi" : "Yarida"}
                      </span>
                    </div>

                    <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3">
                      <div className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400">
                        <Trophy className="h-3.5 w-3.5 text-orange-400" />
                        Detaylari Gor
                      </div>
                      <ChevronRight className="h-4 w-4 text-slate-300 transition-transform group-hover:translate-x-0.5" />
                    </div>
                  </Link>
                );
              })}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}

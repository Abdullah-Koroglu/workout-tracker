import Link from "next/link";
import {
  CheckCircle2,
  ChevronRight,
  Clock,
  Dumbbell,
  MessageSquare,
  Trophy,
  XCircle,
} from "lucide-react";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { PageHero } from "@/components/shared/PageHero";

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

  /* group by month */
  const grouped = workouts.reduce<Record<string, typeof workouts>>((acc, w) => {
    const d   = w.finishedAt ?? w.startedAt;
    const key = d.toLocaleDateString("tr-TR", { month: "long", year: "numeric" });
    if (!acc[key]) acc[key] = [];
    acc[key].push(w);
    return acc;
  }, {});

  const completedCount = workouts.filter((w) => w.status === "COMPLETED").length;
  const abandonedCount = workouts.filter((w) => w.status === "ABANDONED").length;

  /* ── Empty state ── */
  if (workouts.length === 0) {
    return (
      <div className="space-y-6 pb-10">
        {/* Hero */}
        <PageHero
          eyebrow="Performans Geçmişi"
          title="Antrenman Geçmişi"
          subtitle="Tamamlanan ve yarıda bırakılan antrenmanların burada görünür."
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
          <p className="font-bold text-slate-700">Henüz tamamlanan antrenman yok</p>
          <p className="mt-1 text-sm text-slate-400">İlk antrenmanını tamamladığında burada görünecek.</p>
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
    <div className="space-y-6 pb-10">

      {/* ── Hero banner ── */}
      <PageHero
        eyebrow="Performans Geçmişi"
        title="Antrenman Geçmişi"
        stats={[
          { label: "Toplam",     value: workouts.length,  color: "#2563EB", bg: "rgba(37,99,235,0.15)" },
          { label: "Tamamlanan", value: completedCount,   color: "#22C55E", bg: "rgba(34,197,94,0.15)" },
          { label: "Yarıda",     value: abandonedCount,   color: "#F59E0B", bg: "rgba(245,158,11,0.15)" },
        ]}
      />

      {/* ── Monthly groups ── */}
      <div className="space-y-8">
        {Object.entries(grouped).map(([month, monthWorkouts]) => (
          <section key={month} className="space-y-3">
            {/* Month heading */}
            <div className="flex items-center gap-3">
              <h2 className="text-[11px] font-black uppercase tracking-widest text-slate-400 capitalize">
                {month}
              </h2>
              <span
                className="rounded-full px-2.5 py-0.5 text-[10px] font-black"
                style={{ background: "rgba(249,115,22,0.1)", color: "#EA580C" }}
              >
                {monthWorkouts.length}
              </span>
              <div className="h-px flex-1 bg-slate-100" />
            </div>

            {/* Workout cards */}
            <div className="flex flex-col gap-3">
              {monthWorkouts.map((workout) => {
                const isCompleted  = workout.status === "COMPLETED";
                const date         = (workout.finishedAt ?? workout.startedAt)
                  .toLocaleDateString("tr-TR", { day: "numeric", month: "short" });
                const setCount     = workout.sets.length;
                const commentCount = workout.comments.length;
                const duration     = workout.finishedAt
                  ? Math.max(1, Math.round((workout.finishedAt.getTime() - workout.startedAt.getTime()) / 60000))
                  : null;

                return (
                  <Link
                    key={workout.id}
                    href={`/client/workouts/${workout.id}`}
                    className="group flex items-center gap-4 overflow-hidden rounded-2xl bg-white transition-all duration-200 hover:shadow-lg"
                    style={{ boxShadow: "0 2px 16px rgba(0,0,0,0.06), 0 1px 3px rgba(0,0,0,0.04)" }}
                  >
                    {/* Left accent bar */}
                    <div
                      className="h-full w-1 self-stretch flex-shrink-0 rounded-l-2xl"
                      style={{ background: isCompleted ? "#22C55E" : "#F59E0B", minWidth: 4 }}
                    />

                    {/* Status icon */}
                    <div
                      className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl"
                      style={{
                        background: isCompleted
                          ? "rgba(34,197,94,0.1)"
                          : "rgba(245,158,11,0.1)",
                      }}
                    >
                      {isCompleted ? (
                        <CheckCircle2 className="h-5 w-5 text-green-500" />
                      ) : (
                        <XCircle className="h-5 w-5 text-amber-500" />
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex flex-1 flex-col gap-0.5 min-w-0 py-4">
                      <p className="truncate font-black text-slate-800 group-hover:text-orange-600 transition-colors">
                        {workout.template.name}
                      </p>
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-slate-400">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {date}
                          {duration ? ` · ${duration} dk` : ""}
                        </span>
                        <span className="flex items-center gap-1">
                          <Dumbbell className="h-3 w-3" />
                          {setCount} set
                        </span>
                        {commentCount > 0 && (
                          <span className="flex items-center gap-1 text-blue-400">
                            <MessageSquare className="h-3 w-3" />
                            {commentCount} yorum
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Right — badge + chevron */}
                    <div className="flex flex-shrink-0 items-center gap-3 pr-4">
                      <span
                        className="rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-wider"
                        style={
                          isCompleted
                            ? { background: "rgba(34,197,94,0.1)", color: "#16A34A" }
                            : { background: "rgba(245,158,11,0.1)", color: "#D97706" }
                        }
                      >
                        {isCompleted ? "Tamamlandı" : "Yarıda"}
                      </span>
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

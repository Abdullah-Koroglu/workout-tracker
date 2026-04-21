import Link from "next/link";
import { Trophy } from "lucide-react";
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
      <div className="space-y-6">
        <section className="mb-2 flex items-end justify-between">
          <div>
            <p className="mb-1 text-sm uppercase tracking-widest text-secondary">Performance History</p>
            <h1 className="text-3xl font-bold text-on-surface md:text-4xl">Log</h1>
          </div>
        </section>
        <div className="rounded-lg bg-surface-container-low p-8 text-center">
          <p className="text-on-surface-variant">
            Henüz tamamlanan antrenman bulunmamaktadır
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-8">
      <section className="mb-2 flex items-end justify-between">
        <div>
          <p className="mb-1 text-sm uppercase tracking-widest text-secondary">Performance History</p>
          <h1 className="text-3xl font-bold text-on-surface md:text-4xl">Log</h1>
        </div>
      </section>

      <section className="grid grid-cols-3 gap-2 rounded-lg bg-surface-container-low p-3 md:max-w-md">
        <div className="rounded-md bg-surface px-3 py-2 text-center">
          <p className="text-[10px] uppercase tracking-[0.14em] text-on-surface-variant">Toplam</p>
          <p className="mt-1 text-lg font-black text-on-surface">{workouts.length}</p>
        </div>
        <div className="rounded-md bg-surface px-3 py-2 text-center">
          <p className="text-[10px] uppercase tracking-[0.14em] text-on-surface-variant">Tamam</p>
          <p className="mt-1 text-lg font-black text-secondary">{completedCount}</p>
        </div>
        <div className="rounded-md bg-surface px-3 py-2 text-center">
          <p className="text-[10px] uppercase tracking-[0.14em] text-on-surface-variant">Yarıda</p>
          <p className="mt-1 text-lg font-black text-primary">{abandonedCount}</p>
        </div>
      </section>

      <div className="space-y-6">
        {Object.entries(grouped).map(([month, monthWorkouts]) => (
          <section key={month} className="space-y-4">
            <h2 className="sticky top-16 z-10 bg-surface/90 py-2 text-lg font-semibold text-on-surface-variant backdrop-blur-sm">{month}</h2>

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
                  className="group relative block overflow-hidden rounded-lg p-5 transition-colors hover:bg-surface-container bg-slate-700/20"
                >
                  <div className="absolute bottom-0 left-0 top-0 w-1 bg-primary opacity-0 transition-opacity group-hover:opacity-100" />
                  <div className="mb-3 flex items-start justify-between gap-3">
                    <div>
                      <h3 className="text-xl font-bold text-on-surface transition-colors group-hover:text-primary">
                        {workout.template.name}
                      </h3>
                      <p className="mt-1 text-sm text-secondary">
                        {date} • {setCount} set • {Math.max(1, Math.round(setCount * 2.5))} dk
                      </p>
                    </div>
                    <span className="rounded-full bg-secondary-container px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-on-secondary-container">
                      {workout.status === "ABANDONED" ? "Abandoned" : "Completed"}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 text-sm">
                    <span className="text-on-surface-variant">Yorum: {commentCount}</span>
                    {hasPr ? (
                      <span className="inline-flex items-center gap-1 font-bold text-primary">
                        <Trophy className="h-4 w-4" />
                        {workout.sets.filter((s) => s.completed).length > 0 ? "PR Set" : "PR"}
                      </span>
                    ) : null}
                    <span className="ml-auto text-xs font-bold uppercase tracking-widest text-on-surface-variant">Detail</span>
                  </div>

                  {workout.status === "COMPLETED" ? (
                    <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-surface-variant">
                      <div className="h-full w-[88%] bg-gradient-to-r from-primary to-primary-container" />
                    </div>
                  ) : null}
                </Link>
              );
            })}
          </section>
        ))}
      </div>
    </div>
  );
}

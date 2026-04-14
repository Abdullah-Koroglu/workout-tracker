import Link from "next/link";
import { CalendarDays, ChevronRight, ClipboardList, MessageSquareText } from "lucide-react";
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

  if (workouts.length === 0) {
    return (
      <div className="space-y-4">
        <section className="overflow-hidden rounded-2xl border border-emerald-200/60 bg-gradient-to-br from-emerald-50 via-white to-lime-50 p-4 shadow-sm md:rounded-[28px] md:p-6">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-emerald-700 md:text-xs">Client Logbook</p>
          <h1 className="mt-2 text-2xl font-black tracking-tight text-slate-900 md:text-3xl">Antrenman Geçmişi</h1>
          <p className="mt-2 text-xs text-slate-600 md:text-sm">Tamamlanan ve yarıda bırakılan tüm antrenmanlarını buradan takip et.</p>
        </section>
        <div className="rounded-xl border border-dashed bg-gray-50 p-8 text-center dark:bg-gray-800">
          <p className="text-gray-500 dark:text-gray-400">
            Henüz tamamlanan antrenman bulunmamaktadır
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 md:space-y-5">
      <section className="overflow-hidden rounded-2xl border border-emerald-200/60 bg-gradient-to-br from-emerald-50 via-white to-lime-50 p-4 shadow-sm md:rounded-[28px] md:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-emerald-700 md:text-xs">Client Logbook</p>
            <h1 className="mt-2 text-2xl font-black tracking-tight text-slate-900 md:text-3xl">Antrenman Geçmişi</h1>
            <p className="mt-2 text-xs text-slate-600 md:text-sm">Set ve yorum detaylarıyla eski antrenmanlarını incele.</p>
          </div>
          <div className="grid grid-cols-3 gap-2 sm:w-auto">
            <div className="rounded-xl bg-white px-3 py-2 shadow-sm">
              <p className="text-[10px] uppercase tracking-[0.14em] text-slate-500">Toplam</p>
              <p className="mt-1 text-lg font-black text-slate-900">{workouts.length}</p>
            </div>
            <div className="rounded-xl bg-white px-3 py-2 shadow-sm">
              <p className="text-[10px] uppercase tracking-[0.14em] text-slate-500">Tamam</p>
              <p className="mt-1 text-lg font-black text-emerald-700">{workouts.filter((workout) => workout.status === "COMPLETED").length}</p>
            </div>
            <div className="rounded-xl bg-white px-3 py-2 shadow-sm">
              <p className="text-[10px] uppercase tracking-[0.14em] text-slate-500">Yarıda</p>
              <p className="mt-1 text-lg font-black text-amber-700">{workouts.filter((workout) => workout.status === "ABANDONED").length}</p>
            </div>
          </div>
        </div>
      </section>

      <div className="space-y-2.5 md:space-y-3">
        {workouts.map((workout) => {
          const date = workout.finishedAt
            ? new Date(workout.finishedAt).toLocaleDateString("tr-TR")
            : new Date(workout.startedAt).toLocaleDateString("tr-TR");

          const setCount = workout.sets.length;
          const commentCount = workout.comments.length;

          return (
            <Link
              key={workout.id}
              href={`/client/workouts/${workout.id}`}
              className={`block rounded-2xl border bg-white p-3.5 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md dark:bg-gray-800 md:p-4 ${workout.status === "ABANDONED" ? "border-amber-200" : "border-emerald-200"}`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <h3 className="line-clamp-2 text-base font-semibold text-gray-900 dark:text-white md:text-lg">
                    {workout.template.name}
                  </h3>
                  <div className="mt-1 inline-flex items-center gap-1 text-xs text-gray-600 dark:text-gray-400 md:text-sm">
                    <CalendarDays className="h-3.5 w-3.5" />
                    {date}
                  </div>
                  <p className={`mt-2 inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold md:text-xs ${workout.status === "ABANDONED" ? "bg-amber-100 text-amber-700" : "bg-emerald-100 text-emerald-700"}`}>
                    {workout.status === "ABANDONED" ? "Yarıda bırakıldı" : "Tamamlandı"}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <ChevronRight className="h-5 w-5 text-slate-400" />
                  <div className="grid grid-cols-2 gap-2">
                    <div className="rounded-lg bg-slate-50 px-2 py-1.5 text-right dark:bg-slate-900">
                      <p className="inline-flex items-center justify-end gap-1 text-[11px] text-gray-500 dark:text-gray-400">
                        <ClipboardList className="h-3 w-3" />
                        Set
                      </p>
                      <p className="text-sm font-semibold text-gray-900 dark:text-white md:text-base">
                      {setCount}
                      </p>
                    </div>
                    <div className="rounded-lg bg-slate-50 px-2 py-1.5 text-right dark:bg-slate-900">
                      <p className="inline-flex items-center justify-end gap-1 text-[11px] text-gray-500 dark:text-gray-400">
                        <MessageSquareText className="h-3 w-3" />
                        Yorum
                      </p>
                      <p className="text-sm font-semibold text-gray-900 dark:text-white md:text-base">{commentCount}</p>
                    </div>
                  </div>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

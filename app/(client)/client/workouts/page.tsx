import Link from "next/link";
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
        <h1 className="text-2xl font-bold">Antrenman Geçmişi</h1>
        <div className="p-8 bg-gray-50 rounded-lg text-center dark:bg-gray-800">
          <p className="text-gray-500 dark:text-gray-400">
            Henüz tamamlanan antrenman bulunmamaktadır
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Antrenman Geçmişi</h1>

      <div className="space-y-3">
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
              className={`block p-4 bg-white rounded-lg shadow hover:shadow-lg transition-shadow dark:bg-gray-800 border-l-4 ${workout.status === "ABANDONED" ? "border-amber-500" : "border-green-500"}`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="font-semibold text-lg text-gray-900 dark:text-white">
                    {workout.template.name}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {date}
                  </p>
                  <p className={`mt-1 inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${workout.status === "ABANDONED" ? "bg-amber-100 text-amber-700" : "bg-emerald-100 text-emerald-700"}`}>
                    {workout.status === "ABANDONED" ? "Yarıda bırakıldı" : "Tamamlandı"}
                  </p>
                </div>
                <div className="flex gap-4 text-sm text-gray-600 dark:text-gray-400">
                  <div className="text-right">
                    <p className="font-semibold text-gray-900 dark:text-white">
                      {setCount}
                    </p>
                    <p className="text-xs">Set</p>
                  </div>
                  {commentCount > 0 && (
                    <div className="text-right">
                      <p className="font-semibold text-gray-900 dark:text-white">
                        {commentCount}
                      </p>
                      <p className="text-xs">Yorum</p>
                    </div>
                  )}
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

import { ProgressCharts } from "@/components/coach/ProgressCharts";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";

export default async function ClientProgressPage({
  params,
}: {
  params: Promise<{ clientId: string }>;
}) {
  const { clientId } = await params;

  // Get all exercises that have been completed by this client
  const exercises = await prisma.exercise.findMany({
    where: {
      workoutSets: {
        some: {
          workout: {
            clientId,
          },
        },
      },
    },
    select: {
      id: true,
      name: true,
    },
    orderBy: {
      name: "asc",
    },
  });

  if (exercises.length === 0) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold">İlerleme Grafiği</h1>
        <div className="p-8 bg-gray-50 rounded-lg text-center dark:bg-gray-800">
          <p className="text-gray-500 dark:text-gray-400">
            Henüz bu müşteri tarafından tamamlanan antrenman bulunmamaktadır
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">İlerleme Grafiği</h1>
      <ProgressCharts clientId={clientId} exercises={exercises} />
    </div>
  );
}

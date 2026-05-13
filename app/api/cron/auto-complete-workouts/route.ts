import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { notify } from "@/lib/notify";

export async function POST(request: Request) {
  const cronSecret = process.env.CRON_SECRET;
  const provided = request.headers.get("x-cron-secret");
  if (!cronSecret || provided !== cronSecret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const thresholdHours = Number(process.env.WORKOUT_AUTO_COMPLETE_HOURS || 4);
  const cutoff = new Date(Date.now() - thresholdHours * 60 * 60 * 1000);

  const stale = await prisma.workout.findMany({
    where: { status: "IN_PROGRESS", startedAt: { lt: cutoff } },
    select: {
      id: true,
      clientId: true,
      template: { select: { name: true, coachId: true } },
      sets: { where: { completed: true }, select: { id: true } },
    },
  });

  const results: { workoutId: string; status: string }[] = [];

  for (const workout of stale) {
    const hasSets = workout.sets.length > 0;
    const newStatus = hasSets ? "COMPLETED" : "ABANDONED";

    await prisma.workout.update({
      where: { id: workout.id },
      data: { status: newStatus, finishedAt: new Date() },
    });

    if (newStatus === "COMPLETED") {
      await notify({
        userId: workout.clientId,
        title: "Antrenman otomatik tamamlandı",
        body: `"${workout.template.name}" antrenmanın otomatik olarak tamamlandı.`,
        type: "WORKOUT_AUTO_COMPLETED",
        actionUrl: `/client/workouts`,
      }).catch(() => null);
    }

    results.push({ workoutId: workout.id, status: newStatus });
  }

  return NextResponse.json({
    processed: results.length,
    thresholdHours,
    results,
  });
}

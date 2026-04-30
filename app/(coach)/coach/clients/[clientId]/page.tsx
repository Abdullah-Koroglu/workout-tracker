import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getClientTimeline } from "@/lib/coach-timeline";
import { calculateComplianceScore } from "@/lib/analytics/compliance";
import { ClientHub360 } from "@/components/coach/ClientHub360";
import type { StrengthPoint, TonnageWeek, HeatCell } from "@/components/coach/ClientHub360";

function epley1RM(weight: number, reps: number): number {
  return Math.round(weight * (1 + reps / 30));
}

async function tonnage(clientId: string, from: Date, to: Date): Promise<number> {
  const sets = await prisma.workoutSet.findMany({
    where: {
      workout: { clientId, status: "COMPLETED", startedAt: { gte: from, lt: to } },
      weightKg: { not: null },
      reps: { not: null },
      completed: true,
    },
    select: { weightKg: true, reps: true },
  });
  return sets.reduce((s, r) => s + r.weightKg! * r.reps!, 0);
}

export default async function CoachClientDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ clientId: string }>;
  searchParams: Promise<{ page?: string }>;
}) {
  const session = await auth();
  const { clientId } = await params;
  const qp = await searchParams;
  const currentPage = Math.max(1, Number(qp.page) || 1);
  const pageSize = 10;

  const relation = await prisma.coachClientRelation.findFirst({
    where: { coachId: session?.user.id, clientId, status: "ACCEPTED" },
  });
  if (!relation) return notFound();

  const client = await prisma.user.findUnique({
    where: { id: clientId },
    include: { clientProfile: true },
  });
  if (!client) return notFound();

  const [coachProfile, assignments, { items: timelineItems, totalPages }, complianceScore, completedCount, totalCount] =
    await Promise.all([
      prisma.coachProfile.findUnique({ where: { userId: session!.user.id }, select: { subscriptionTier: true } }),
      prisma.templateAssignment.findMany({
        where: { clientId, workouts: { none: { status: "COMPLETED" } } },
        include: { template: true, _count: { select: { workouts: true } } },
        orderBy: [{ scheduledFor: "asc" }, { createdAt: "desc" }],
      }),
      getClientTimeline(clientId, currentPage, pageSize),
      calculateComplianceScore(clientId),
      prisma.workout.count({ where: { clientId, status: "COMPLETED" } }),
      prisma.workout.count({ where: { clientId } }),
    ]);

  // ── Strength trends ─────────────────────────────────────────────────────────
  const twelveWeeksAgo = new Date(Date.now() - 84 * 24 * 60 * 60 * 1000);
  const weightSets = await prisma.workoutSet.findMany({
    where: {
      workout: { clientId, status: "COMPLETED", startedAt: { gte: twelveWeeksAgo } },
      weightKg: { not: null },
      reps: { not: null },
      completed: true,
    },
    include: { exercise: { select: { name: true } }, workout: { select: { startedAt: true } } },
    orderBy: { workout: { startedAt: "asc" } },
  });

  type WeekMap = Record<string, Record<string, number>>;
  const weekMap: WeekMap = {};
  const exerciseNames: string[] = [];

  for (const s of weightSets) {
    const d = new Date(s.workout.startedAt);
    const mon = new Date(d);
    mon.setDate(d.getDate() - ((d.getDay() + 6) % 7));
    const wk = mon.toLocaleDateString("tr-TR", { day: "numeric", month: "short" });
    if (!weekMap[wk]) weekMap[wk] = {};
    if (!exerciseNames.includes(s.exercise.name)) exerciseNames.push(s.exercise.name);
    const rm = epley1RM(s.weightKg!, s.reps!);
    weekMap[wk][s.exercise.name] = Math.max(weekMap[wk][s.exercise.name] ?? 0, rm);
  }

  const [ex1 = "Bench Press", ex2 = "Squat", ex3 = "Deadlift"] = exerciseNames;
  const strengthTrend: StrengthPoint[] = Object.entries(weekMap).map(([week, exMap]) => ({
    week,
    benchPress: exMap[ex1] ?? 0,
    squat: exMap[ex2] ?? 0,
    deadlift: exMap[ex3] ?? 0,
  }));

  // ── Weekly tonnage ─────────────────────────────────────────────────────────
  const now = new Date();
  const thisWeekStart = new Date(now);
  thisWeekStart.setDate(now.getDate() - ((now.getDay() + 6) % 7));
  thisWeekStart.setHours(0, 0, 0, 0);
  const lastWeekStart = new Date(thisWeekStart.getTime() - 7 * 86400000);

  const [currentTonnage, prevTonnage] = await Promise.all([
    tonnage(clientId, thisWeekStart, now),
    tonnage(clientId, lastWeekStart, thisWeekStart),
  ]);
  const weeklyTonnage: TonnageWeek = { current: currentTonnage, prev: prevTonnage };

  // ── Heatmap (last 30 days) ─────────────────────────────────────────────────
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 86400000);
  const last30Workouts = await prisma.workout.findMany({
    where: { clientId, startedAt: { gte: thirtyDaysAgo } },
    select: { startedAt: true, status: true },
  });

  const workoutByDate = new Map<string, "completed" | "missed">();
  for (const w of last30Workouts) {
    const key = w.startedAt.toISOString().split("T")[0];
    if (w.status === "COMPLETED") workoutByDate.set(key, "completed");
    else if (!workoutByDate.has(key)) workoutByDate.set(key, "missed");
  }

  const heatmap: HeatCell[] = Array.from({ length: 30 }, (_, i) => {
    const d = new Date(now.getTime() - (29 - i) * 86400000);
    const key = d.toISOString().split("T")[0];
    return {
      date: d.toLocaleDateString("tr-TR", { day: "numeric", month: "short" }),
      status: workoutByDate.get(key) ?? "rest",
    };
  });

  const age = client.clientProfile?.birthDate
    ? Math.floor((Date.now() - new Date(client.clientProfile.birthDate).getTime()) / (365.25 * 86400000))
    : null;

  return (
    <ClientHub360
      clientId={clientId}
      name={client.name}
      email={client.email}
      age={age}
      weightKg={client.clientProfile?.weightKg ?? null}
      goal={client.clientProfile?.goal ?? null}
      fitnessLevel={client.clientProfile?.fitnessLevel ?? null}
      completedWorkouts={completedCount}
      totalWorkouts={totalCount}
      complianceScore={complianceScore}
      subscriptionTier={coachProfile?.subscriptionTier ?? "FREE"}
      assignments={assignments.map((a) => ({
        id: a.id,
        templateId: a.templateId,
        templateName: a.template.name,
        createdAt: a.createdAt.toISOString(),
        scheduledFor: a.scheduledFor.toISOString(),
        workoutsCount: a._count.workouts,
      }))}
      timelineItems={timelineItems}
      currentPage={currentPage}
      totalPages={totalPages}
      strengthTrend={strengthTrend}
      weeklyTonnage={weeklyTonnage}
      heatmap={heatmap}
    />
  );
}

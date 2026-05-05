import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import { checkFeatureAccess, tierAccessDenied } from "@/lib/feature-access";

const MUSCLE_GROUPS = ["Göğüs", "Sırt", "Bacak", "Omuz", "Kol", "Core", "Diğer"] as const;
type Muscle = (typeof MUSCLE_GROUPS)[number];

function normalizeMuscle(raw: string | null): Muscle {
  if (!raw) return "Diğer";
  const map: Record<string, Muscle> = {
    chest: "Göğüs", göğüs: "Göğüs",
    back: "Sırt", sırt: "Sırt",
    leg: "Bacak", legs: "Bacak", bacak: "Bacak",
    shoulder: "Omuz", shoulders: "Omuz", omuz: "Omuz",
    arm: "Kol", arms: "Kol", kol: "Kol", bicep: "Kol", tricep: "Kol",
    core: "Core", abs: "Core", karın: "Core",
  };
  return map[raw.toLowerCase().trim()] ?? "Diğer";
}

function tonnageByMuscle(
  sets: { weightKg: number | null; reps: number | null; exercise: { targetMuscle: string | null } }[]
): Record<Muscle, number> {
  const result = Object.fromEntries(MUSCLE_GROUPS.map((m) => [m, 0])) as Record<Muscle, number>;
  for (const s of sets) {
    if (s.weightKg && s.reps) {
      const muscle = normalizeMuscle(s.exercise.targetMuscle);
      result[muscle] += s.weightKg * s.reps;
    }
  }
  return result;
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ clientId: string }> }
) {
  const auth = await requireAuth("COACH");
  if (auth.error) return auth.error;

  const access = await checkFeatureAccess(auth.session.user.id, "analytics");
  if (!access.allowed) return tierAccessDenied(access.reason, access.tier);

  const { clientId } = await params;
  const { searchParams } = new URL(request.url);

  // windowDays: how many days per period (default 7)
  const windowDays = Math.min(90, Math.max(1, Number(searchParams.get("window") ?? 7)));

  const now = new Date();
  const currentEnd = now;
  const currentStart = new Date(now.getTime() - windowDays * 86400000);
  const prevEnd = currentStart;
  const prevStart = new Date(currentStart.getTime() - windowDays * 86400000);

  // Verify coach–client relationship
  const relation = await prisma.coachClientRelation.findUnique({
    where: { coachId_clientId: { coachId: auth.session.user.id, clientId } },
    select: { status: true },
  });
  if (!relation || relation.status !== "ACCEPTED") {
    return NextResponse.json({ error: "Yetkisiz erişim." }, { status: 403 });
  }

  const fetchSets = (from: Date, to: Date) =>
    prisma.workoutSet.findMany({
      where: {
        workout: {
          clientId,
          status: "COMPLETED",
          startedAt: { gte: from, lte: to },
        },
        weightKg: { not: null },
        reps: { not: null },
      },
      select: {
        weightKg: true,
        reps: true,
        exercise: { select: { targetMuscle: true } },
      },
    });

  const [currentSets, prevSets] = await Promise.all([
    fetchSets(currentStart, currentEnd),
    fetchSets(prevStart, prevEnd),
  ]);

  const current = tonnageByMuscle(currentSets);
  const prev = tonnageByMuscle(prevSets);

  // Only include muscles that have any data in either period
  const data = MUSCLE_GROUPS.filter((m) => current[m] > 0 || prev[m] > 0).map((m) => ({
    muscle: m,
    currentPeriod: Math.round(current[m]),
    prevPeriod: Math.round(prev[m]),
    change:
      prev[m] > 0
        ? Math.round(((current[m] - prev[m]) / prev[m]) * 100)
        : current[m] > 0
        ? 100
        : 0,
  }));

  return NextResponse.json({
    data,
    windowDays,
    currentPeriod: { from: currentStart.toISOString(), to: currentEnd.toISOString() },
    prevPeriod: { from: prevStart.toISOString(), to: prevEnd.toISOString() },
  });
}

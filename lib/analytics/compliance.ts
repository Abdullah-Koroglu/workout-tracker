import { prisma } from "@/lib/prisma";

const WINDOW_DAYS = 30;
const SKIPPED_SET_PENALTY_MAX = 15; // max penalty points deducted for skipped cardio sets

/**
 * Calculates a 0–100 compliance score for a client over the last 30 days.
 *
 * Formula:
 *   base  = (completedWorkouts / assignedWorkouts) * 100
 *   penalty = min(SKIPPED_SET_PENALTY_MAX, skippedCardioSets / totalCardioSets * SKIPPED_SET_PENALTY_MAX)
 *   score = max(0, round(base - penalty))
 *
 * Returns null when there are no assignments (score is meaningless).
 */
export async function calculateComplianceScore(clientId: string): Promise<number | null> {
  const since = new Date(Date.now() - WINDOW_DAYS * 24 * 60 * 60 * 1000);

  const assignments = await prisma.templateAssignment.findMany({
    where: { clientId, scheduledFor: { gte: since, lte: new Date() } },
    select: {
      id: true,
      workouts: {
        select: {
          status: true,
          sets: { select: { completed: true, durationMinutes: true } },
        },
      },
    },
  });

  if (assignments.length === 0) return null;

  let completed = 0;
  let totalCardio = 0;
  let skippedCardio = 0;

  for (const a of assignments) {
    const doneWorkout = a.workouts.find((w) => w.status === "COMPLETED");
    if (doneWorkout) {
      completed++;
      for (const set of doneWorkout.sets) {
        if (set.durationMinutes !== null) {
          totalCardio++;
          if (!set.completed) skippedCardio++;
        }
      }
    }
  }

  const base = (completed / assignments.length) * 100;

  const penalty =
    totalCardio > 0
      ? Math.min(SKIPPED_SET_PENALTY_MAX, (skippedCardio / totalCardio) * SKIPPED_SET_PENALTY_MAX)
      : 0;

  return Math.max(0, Math.round(base - penalty));
}

export function complianceColor(score: number): string {
  if (score >= 80) return "#22C55E";
  if (score >= 50) return "#F59E0B";
  return "#EF4444";
}

export function complianceLabel(score: number): string {
  if (score >= 80) return "İyi";
  if (score >= 50) return "Orta";
  return "Düşük";
}

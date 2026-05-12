import { prisma } from "@/lib/prisma";
import { unlockAchievement } from "@/lib/achievements";

function epley(weight: number, reps: number) {
  if (reps <= 0) return weight;
  return weight * (1 + reps / 30);
}

export async function updatePersonalRecordsForWorkout(workoutId: string) {
  const workout = await prisma.workout.findUnique({
    where: { id: workoutId },
    include: {
      sets: { where: { completed: true, weightKg: { not: null }, reps: { not: null } } },
    },
  });
  if (!workout) return;

  const byExercise = new Map<string, { weightKg: number; reps: number; oneRM: number }>();
  for (const set of workout.sets) {
    if (set.weightKg == null || set.reps == null) continue;
    const oneRM = epley(set.weightKg, set.reps);
    const existing = byExercise.get(set.exerciseId);
    if (!existing || oneRM > existing.oneRM) {
      byExercise.set(set.exerciseId, { weightKg: set.weightKg, reps: set.reps, oneRM });
    }
  }

  let firstPR = false;
  for (const [exerciseId, best] of byExercise) {
    const prior = await prisma.personalRecord.findFirst({
      where: { clientId: workout.clientId, exerciseId },
      orderBy: { estimatedOneRM: "desc" },
    });
    if (!prior || (prior.estimatedOneRM ?? 0) < best.oneRM) {
      await prisma.personalRecord.create({
        data: {
          clientId: workout.clientId,
          exerciseId,
          weightKg: best.weightKg,
          reps: best.reps,
          estimatedOneRM: Math.round(best.oneRM * 10) / 10,
          workoutId,
        },
      });
      if (!prior) firstPR = true;
    }
  }

  if (firstPR) await unlockAchievement(workout.clientId, "FIRST_PR");
}

import { prisma } from "@/lib/prisma";

// ─── Types ────────────────────────────────────────────────────────────────────

export type SetItem = {
  id: string;
  setNumber: number;
  weightKg: number | null;
  reps: number | null;
  rir: number | null;
  durationMinutes: number | null;
  durationSeconds: number | null;
  completed: boolean;
  actualRestSeconds: number | null;
  prescribedRestSeconds: number | null;
  exercise: { name: string; type: "WEIGHT" | "CARDIO" };
};

export type WorkoutTimelineItem = {
  type: "workout";
  id: string;
  startedAt: string;
  finishedAt: string | null;
  durationMinutes: number | null;
  intensityScore: number | null;
  status: "IN_PROGRESS" | "COMPLETED" | "ABANDONED";
  assignment: { id: string; scheduledFor: string; createdAt: string };
  template: { name: string; description: string | null };
  sets: SetItem[];
  comments: Array<{
    id: string;
    content: string;
    createdAt: string;
    author: { name: string };
  }>;
};

export type MissedTimelineItem = {
  type: "missed";
  id: string;
  templateName: string;
  scheduledFor: string;
  createdAt: string;
};

export type TimelineItem = WorkoutTimelineItem | MissedTimelineItem;

export type TimelineResult = {
  items: TimelineItem[];
  total: number;
  totalPages: number;
};

// ─── Core logic ───────────────────────────────────────────────────────────────

/**
 * Returns a unified, date-sorted page of workout history + overdue missed
 * assignments for a given client.
 *
 * Sort key:
 *   - workout   → startedAt DESC
 *   - missed    → scheduledFor DESC
 * Both are mixed into one chronological list via a UNION query.
 */
export async function getClientTimeline(
  clientId: string,
  page: number,
  pageSize = 10
): Promise<TimelineResult> {
  const skip = (page - 1) * pageSize;
  const now = new Date();

  // Total count across both types
  const [countRow] = await prisma.$queryRaw<[{ count: bigint }]>`
    SELECT COUNT(*)::bigint AS count
    FROM (
      SELECT id
      FROM   "TemplateAssignment"
      WHERE  "clientId" = ${clientId}
        AND  "scheduledFor" < ${now}
        AND  NOT EXISTS (
               SELECT 1 FROM "Workout" w
               WHERE  w."assignmentId" = "TemplateAssignment".id
                 AND  w.status = 'COMPLETED'
             )
      UNION ALL
      SELECT id
      FROM   "Workout"
      WHERE  "clientId" = ${clientId}
    ) t
  `;

  const total = Number(countRow.count);
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  // Paginated, sorted row stubs
  const rows = await prisma.$queryRaw<Array<{ type: string; id: string }>>`
    SELECT 'missed'  AS type, id, "scheduledFor" AS sort_date
    FROM   "TemplateAssignment"
    WHERE  "clientId" = ${clientId}
      AND  "scheduledFor" < ${now}
      AND  NOT EXISTS (
             SELECT 1 FROM "Workout" w
             WHERE  w."assignmentId" = "TemplateAssignment".id
               AND  w.status = 'COMPLETED'
           )
    UNION ALL
    SELECT 'workout' AS type, id, "startedAt" AS sort_date
    FROM   "Workout"
    WHERE  "clientId" = ${clientId}
    ORDER  BY sort_date DESC
    LIMIT  ${pageSize}
    OFFSET ${skip}
  `;

  if (rows.length === 0) return { items: [], total, totalPages };

  const workoutIds = rows.filter((r) => r.type === "workout").map((r) => r.id);
  const missedIds  = rows.filter((r) => r.type === "missed").map((r) => r.id);

  // Fetch full data for both types in parallel
  const [workouts, assignments] = await Promise.all([
    workoutIds.length > 0
      ? prisma.workout.findMany({
          where: { id: { in: workoutIds } },
          include: {
            template: true,
            assignment: {
              select: { id: true, scheduledFor: true, createdAt: true },
            },
            sets: {
              include: {
                exercise: { select: { name: true, type: true } },
              },
              orderBy: [{ exerciseId: "asc" }, { setNumber: "asc" }],
            },
            comments: {
              include: { author: { select: { name: true } } },
              orderBy: { createdAt: "asc" },
            },
          },
        })
      : Promise.resolve([]),
    missedIds.length > 0
      ? prisma.templateAssignment.findMany({
          where: { id: { in: missedIds } },
          include: { template: { select: { name: true } } },
        })
      : Promise.resolve([]),
  ]);

  const workoutMap = new Map(workouts.map((w) => [w.id, w]));
  const assignmentMap = new Map(assignments.map((a) => [a.id, a]));

  // Reconstruct in UNION order (preserves sort)
  const items: TimelineItem[] = rows.map((row): TimelineItem => {
    if (row.type === "workout") {
      const w = workoutMap.get(row.id)!;
      const durationMinutes = w.finishedAt
        ? Math.round((w.finishedAt.getTime() - w.startedAt.getTime()) / 60000)
        : null;
      return {
        type: "workout",
        id: w.id,
        startedAt: w.startedAt.toISOString(),
        finishedAt: w.finishedAt?.toISOString() ?? null,
        durationMinutes,
        intensityScore: w.intensityScore,
        status: w.status,
        assignment: {
          id: w.assignment.id,
          scheduledFor: w.assignment.scheduledFor.toISOString(),
          createdAt: w.assignment.createdAt.toISOString(),
        },
        template: {
          name: w.template.name,
          description: w.template.description,
        },
        sets: w.sets.map((s) => ({
          id: s.id,
          setNumber: s.setNumber,
          weightKg: s.weightKg,
          reps: s.reps,
          rir: s.rir,
          durationMinutes: s.durationMinutes,
          durationSeconds: s.durationSeconds,
          completed: s.completed,
          actualRestSeconds: (s as { actualRestSeconds?: number | null }).actualRestSeconds ?? null,
          prescribedRestSeconds: null, // not yet in schema
          exercise: { name: s.exercise.name, type: s.exercise.type },
        })),
        comments: w.comments.map((c) => ({
          id: c.id,
          content: c.content,
          createdAt: c.createdAt.toISOString(),
          author: { name: c.author.name },
        })),
      };
    } else {
      const a = assignmentMap.get(row.id)!;
      return {
        type: "missed",
        id: a.id,
        templateName: a.template.name,
        scheduledFor: a.scheduledFor.toISOString(),
        createdAt: a.createdAt.toISOString(),
      };
    }
  });

  return { items, total, totalPages };
}

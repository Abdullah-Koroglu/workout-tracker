import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";

const INACTIVE_DAYS = 7;

export async function GET() {
  const auth = await requireAuth("COACH");
  if (auth.error) return auth.error;

  const coachId = auth.session.user.id;
  const cutoff = new Date(Date.now() - INACTIVE_DAYS * 24 * 60 * 60 * 1000);

  const relations = await prisma.coachClientRelation.findMany({
    where: { coachId, status: "ACCEPTED" },
    include: {
      client: {
        select: {
          id: true,
          name: true,
          workouts: {
            where: { status: "COMPLETED" },
            orderBy: { finishedAt: "desc" },
            take: 1,
            select: { finishedAt: true },
          },
          assignments: {
            where: { scheduledFor: { lte: new Date() } },
            orderBy: { scheduledFor: "desc" },
            take: 10,
            select: {
              scheduledFor: true,
              workouts: { select: { status: true }, take: 1 },
            },
          },
        },
      },
    },
  });

  const risks = relations
    .map(({ client }) => {
      const lastWorkout = client.workouts[0]?.finishedAt ?? null;
      const inactiveDays = lastWorkout
        ? Math.floor((Date.now() - lastWorkout.getTime()) / 86400000)
        : null;

      const recentAssignments = client.assignments.slice(0, 5);
      const missedCount = recentAssignments.filter(
        (a) => a.workouts.length === 0 || a.workouts[0].status === "ABANDONED"
      ).length;

      const isAtRisk =
        (lastWorkout === null && recentAssignments.length > 0) ||
        (lastWorkout !== null && lastWorkout < cutoff) ||
        missedCount >= 2;

      return {
        clientId: client.id,
        name: client.name,
        lastWorkout,
        inactiveDays,
        missedCount,
        isAtRisk,
      };
    })
    .filter((c) => c.isAtRisk)
    .sort((a, b) => (b.inactiveDays ?? 999) - (a.inactiveDays ?? 999));

  return NextResponse.json({ risks });
}

import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";

// Returns ALL achievements + the requesting user's unlock status
export async function GET() {
  const auth = await requireAuth();
  if ("error" in auth) return auth.error;

  const [all, unlocked] = await Promise.all([
    prisma.achievement.findMany({ orderBy: [{ category: "asc" }, { points: "asc" }] }),
    prisma.userAchievement.findMany({
      where: { userId: auth.session.user.id },
      select: { achievementId: true, unlockedAt: true },
    }),
  ]);

  const unlockedMap = new Map(unlocked.map((u) => [u.achievementId, u.unlockedAt]));

  return NextResponse.json({
    achievements: all.map((a) => ({
      ...a,
      unlockedAt: unlockedMap.get(a.id) ?? null,
    })),
    totalPoints: all
      .filter((a) => unlockedMap.has(a.id))
      .reduce((sum, a) => sum + a.points, 0),
  });
}

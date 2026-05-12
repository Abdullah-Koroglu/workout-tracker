import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import { unlockAchievement, ensureAchievementsSeeded } from "@/lib/achievements";

function dayKey(date: Date) {
  return `${date.getUTCFullYear()}-${date.getUTCMonth()}-${date.getUTCDate()}`;
}

export async function GET(request: Request) {
  const auth = await requireAuth();
  if ("error" in auth) return auth.error;

  const url = new URL(request.url);
  const requestedClient = url.searchParams.get("clientId");
  let clientId = auth.session.user.id;

  if (auth.session.user.role === "COACH") {
    if (!requestedClient) return NextResponse.json({ error: "clientId required" }, { status: 400 });
    clientId = requestedClient;
  }

  // Fetch last 365 completed workouts
  const workouts = await prisma.workout.findMany({
    where: { clientId, status: "COMPLETED" },
    select: { finishedAt: true },
    orderBy: { finishedAt: "desc" },
    take: 365,
  });

  if (workouts.length === 0) {
    return NextResponse.json({ currentStreak: 0, longestStreak: 0, totalWorkouts: 0, activeDays: [] });
  }

  // Build set of unique day keys with a completed workout
  const activeDaySet = new Set<string>();
  for (const w of workouts) {
    if (w.finishedAt) activeDaySet.add(dayKey(new Date(w.finishedAt)));
  }

  // Compute current streak (consecutive days backwards from today or yesterday)
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);

  let currentStreak = 0;
  const cursor = new Date(today);

  // If no workout today, check from yesterday
  if (!activeDaySet.has(dayKey(today))) {
    cursor.setUTCDate(cursor.getUTCDate() - 1);
  }

  while (activeDaySet.has(dayKey(cursor))) {
    currentStreak++;
    cursor.setUTCDate(cursor.getUTCDate() - 1);
  }

  // Compute longest streak ever
  const sortedDays = Array.from(activeDaySet).sort();
  let longestStreak = 0;
  let runLength = 1;

  for (let i = 1; i < sortedDays.length; i++) {
    const prev = new Date(sortedDays[i - 1]);
    const curr = new Date(sortedDays[i]);
    const diffMs = curr.getTime() - prev.getTime();
    const diffDays = Math.round(diffMs / 86400000);

    if (diffDays === 1) {
      runLength++;
    } else {
      longestStreak = Math.max(longestStreak, runLength);
      runLength = 1;
    }
  }
  longestStreak = Math.max(longestStreak, runLength);

  // Unlock streak achievements (best-effort)
  try {
    await ensureAchievementsSeeded();
    if (currentStreak >= 3) await unlockAchievement(clientId, "STREAK_3_DAYS");
    if (currentStreak >= 7) await unlockAchievement(clientId, "STREAK_7_DAYS");
    if (currentStreak >= 30) await unlockAchievement(clientId, "STREAK_30_DAYS");
  } catch { /* non-fatal */ }

  // Return last 14 active days for the mini calendar
  const last14 = Array.from({ length: 14 }, (_, i) => {
    const d = new Date(today);
    d.setUTCDate(d.getUTCDate() - (13 - i));
    return { key: dayKey(d), date: d.toISOString(), active: activeDaySet.has(dayKey(d)) };
  });

  return NextResponse.json({
    currentStreak,
    longestStreak,
    totalWorkouts: workouts.length,
    activeDays: last14,
  });
}

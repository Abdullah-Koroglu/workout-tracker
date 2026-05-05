import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import type { TrackingFrequency } from "@prisma/client";

function todayMidnightUTC(): Date {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
}

function daysBetween(a: Date, b: Date): number {
  return Math.floor((b.getTime() - a.getTime()) / (1000 * 60 * 60 * 24));
}

function weekStart(d: Date): Date {
  const mon = new Date(d);
  mon.setUTCDate(d.getUTCDate() - ((d.getUTCDay() + 6) % 7));
  mon.setUTCHours(0, 0, 0, 0);
  return mon;
}

function isRequiredToday(
  freq: TrackingFrequency,
  lastLogDate: Date | null,
  logsThisWeek: number
): boolean {
  if (freq === "OFF") return false;
  if (freq === "DAILY") return true;

  const today = todayMidnightUTC();

  if (lastLogDate) {
    const lastDay = new Date(Date.UTC(
      lastLogDate.getUTCFullYear(),
      lastLogDate.getUTCMonth(),
      lastLogDate.getUTCDate()
    ));
    const days = daysBetween(lastDay, today);

    if (freq === "EVERY_2_DAYS") return days >= 2;
    if (freq === "EVERY_3_DAYS") return days >= 3;
    if (freq === "WEEKLY") return days >= 7;
    if (freq === "BIWEEKLY") return days >= 14;
    if (freq === "MONTHLY") return days >= 28;
    if (freq === "TWICE_A_WEEK") return logsThisWeek < 2;
  } else {
    // No log ever — always required (except OFF)
    return true;
  }

  return false;
}

export async function GET() {
  const auth = await requireAuth("CLIENT");
  if (auth.error) return auth.error;

  const clientId = auth.session.user.id;
  const today = todayMidnightUTC();
  const monStart = weekStart(today);

  const [prefs, todayLog, lastLog, weekLogs, totalLogs] = await Promise.all([
    prisma.bodyTrackingPreference.findUnique({ where: { clientId } }),
    prisma.bodyMetricLog.findUnique({ where: { clientId_date: { clientId, date: today } } }),
    prisma.bodyMetricLog.findFirst({
      where: { clientId, date: { lt: today } },
      orderBy: { date: "desc" },
      select: { date: true },
    }),
    prisma.bodyMetricLog.count({
      where: { clientId, date: { gte: monStart, lt: today } },
    }),
    prisma.bodyMetricLog.count({ where: { clientId } }),
  ]);

  if (!prefs) {
    return NextResponse.json({
      required: false,
      alreadyLoggedToday: false,
      requiresWeight: false,
      requiresMeasurements: false,
      requiresPhotos: false,
      activeMeasurements: [],
      totalLogs: 0,
    });
  }

  const alreadyLoggedToday = Boolean(todayLog);
  const lastLogDate = lastLog?.date ?? null;

  const requiresWeight = !alreadyLoggedToday && isRequiredToday(prefs.weightFreq, lastLogDate, weekLogs);
  const requiresMeasurements = !alreadyLoggedToday && isRequiredToday(prefs.measurementFreq, lastLogDate, weekLogs);
  const requiresPhotos = !alreadyLoggedToday && isRequiredToday(prefs.photoFreq, lastLogDate, weekLogs);

  let activeMeasurements: string[] = [];
  try {
    activeMeasurements = JSON.parse(prefs.activeMeasurements);
  } catch {
    activeMeasurements = [];
  }

  const required = requiresWeight || requiresMeasurements || requiresPhotos;

  return NextResponse.json({
    required,
    alreadyLoggedToday,
    requiresWeight,
    requiresMeasurements,
    requiresPhotos,
    activeMeasurements,
    totalLogs,
  });
}

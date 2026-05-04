import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import type { TrackingFrequency } from "@prisma/client";

const VALID_FREQUENCIES: TrackingFrequency[] = [
  "OFF", "DAILY", "EVERY_2_DAYS", "EVERY_3_DAYS",
  "TWICE_A_WEEK", "WEEKLY", "BIWEEKLY", "MONTHLY",
];
const VALID_MEASUREMENTS = ["shoulder", "chest", "waist", "hips", "arm", "leg"];

async function ensureCoachOwnsClient(coachId: string, clientId: string) {
  const rel = await prisma.coachClientRelation.findFirst({
    where: { coachId, clientId, status: "ACCEPTED" },
    select: { id: true },
  });
  return Boolean(rel);
}

export async function GET(
  _req: Request,
  context: { params: Promise<{ clientId: string }> }
) {
  const auth = await requireAuth("COACH");
  if (auth.error) return auth.error;

  const { clientId } = await context.params;
  if (!(await ensureCoachOwnsClient(auth.session.user.id, clientId))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const prefs = await prisma.bodyTrackingPreference.findUnique({ where: { clientId } });
  return NextResponse.json({ prefs });
}

export async function PUT(
  req: Request,
  context: { params: Promise<{ clientId: string }> }
) {
  const auth = await requireAuth("COACH");
  if (auth.error) return auth.error;

  const { clientId } = await context.params;
  if (!(await ensureCoachOwnsClient(auth.session.user.id, clientId))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json().catch(() => ({}));
  const { weightFreq, measurementFreq, photoFreq, activeMeasurements } = body;

  if (weightFreq && !VALID_FREQUENCIES.includes(weightFreq)) {
    return NextResponse.json({ error: "Invalid weightFreq" }, { status: 400 });
  }
  if (measurementFreq && !VALID_FREQUENCIES.includes(measurementFreq)) {
    return NextResponse.json({ error: "Invalid measurementFreq" }, { status: 400 });
  }
  if (photoFreq && !VALID_FREQUENCIES.includes(photoFreq)) {
    return NextResponse.json({ error: "Invalid photoFreq" }, { status: 400 });
  }
  if (activeMeasurements !== undefined) {
    if (!Array.isArray(activeMeasurements) || activeMeasurements.some((m: string) => !VALID_MEASUREMENTS.includes(m))) {
      return NextResponse.json({ error: "Invalid activeMeasurements" }, { status: 400 });
    }
  }

  const prefs = await prisma.bodyTrackingPreference.upsert({
    where: { clientId },
    create: {
      clientId,
      weightFreq: weightFreq ?? "OFF",
      measurementFreq: measurementFreq ?? "OFF",
      photoFreq: photoFreq ?? "OFF",
      activeMeasurements: JSON.stringify(activeMeasurements ?? []),
    },
    update: {
      ...(weightFreq !== undefined && { weightFreq }),
      ...(measurementFreq !== undefined && { measurementFreq }),
      ...(photoFreq !== undefined && { photoFreq }),
      ...(activeMeasurements !== undefined && { activeMeasurements: JSON.stringify(activeMeasurements) }),
    },
  });

  return NextResponse.json({ prefs });
}

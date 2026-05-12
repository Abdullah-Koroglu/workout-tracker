import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";

// GET /api/coach/availability/public?coachId=...
// Returns a coach's availability slots (readable by any authenticated user)
export async function GET(request: Request) {
  const auth = await requireAuth();
  if ("error" in auth) return auth.error;

  const { searchParams } = new URL(request.url);
  const coachId = searchParams.get("coachId");
  if (!coachId) return NextResponse.json({ error: "coachId required" }, { status: 400 });

  const slots = await prisma.coachAvailability.findMany({
    where: { coachId },
    orderBy: { dayOfWeek: "asc" },
    select: { dayOfWeek: true, startTime: true, endTime: true },
  });

  return NextResponse.json({ slots });
}

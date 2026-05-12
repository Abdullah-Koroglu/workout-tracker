import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAuth } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";

const slotSchema = z.object({
  dayOfWeek: z.number().int().min(0).max(6),
  startTime: z.string().regex(/^\d{2}:\d{2}$/),
  endTime: z.string().regex(/^\d{2}:\d{2}$/),
});

const updateSchema = z.object({
  slots: z.array(slotSchema),
});

// GET /api/coach/availability
export async function GET() {
  const auth = await requireAuth("COACH");
  if ("error" in auth) return auth.error;

  const slots = await prisma.coachAvailability.findMany({
    where: { coachId: auth.session.user.id },
    orderBy: { dayOfWeek: "asc" },
  });

  return NextResponse.json({ slots });
}

// PUT /api/coach/availability
export async function PUT(request: Request) {
  const auth = await requireAuth("COACH");
  if ("error" in auth) return auth.error;

  const body = await request.json();
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const coachId = auth.session.user.id;

  // Delete all existing and recreate
  await prisma.coachAvailability.deleteMany({ where: { coachId } });

  if (parsed.data.slots.length > 0) {
    await prisma.coachAvailability.createMany({
      data: parsed.data.slots.map((s) => ({ coachId, ...s })),
    });
  }

  const slots = await prisma.coachAvailability.findMany({
    where: { coachId },
    orderBy: { dayOfWeek: "asc" },
  });

  return NextResponse.json({ slots });
}

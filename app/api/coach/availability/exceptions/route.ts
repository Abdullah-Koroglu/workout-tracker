import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAuth } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";

const putSchema = z.object({
  exceptions: z.array(
    z.object({
      date: z.string().datetime().or(z.string().date()),
      isClosed: z.boolean().default(true),
      startTime: z.string().regex(/^\d{2}:\d{2}$/).optional(),
      endTime: z.string().regex(/^\d{2}:\d{2}$/).optional(),
    }),
  ).max(100),
});

export async function GET() {
  const auth = await requireAuth("COACH");
  if ("error" in auth) return auth.error;
  const exceptions = await prisma.availabilityException.findMany({
    where: { coachId: auth.session.user.id },
    orderBy: { date: "asc" },
  });
  return NextResponse.json({ exceptions });
}

export async function PUT(request: Request) {
  const auth = await requireAuth("COACH");
  if ("error" in auth) return auth.error;
  const body = await request.json();
  const parsed = putSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const coachId = auth.session.user.id;
  await prisma.availabilityException.deleteMany({ where: { coachId } });
  if (parsed.data.exceptions.length > 0) {
    await prisma.availabilityException.createMany({
      data: parsed.data.exceptions.map((e) => ({
        coachId,
        date: new Date(e.date),
        isClosed: e.isClosed,
        startTime: e.startTime ?? null,
        endTime: e.endTime ?? null,
      })),
    });
  }

  const exceptions = await prisma.availabilityException.findMany({
    where: { coachId },
    orderBy: { date: "asc" },
  });
  return NextResponse.json({ exceptions });
}

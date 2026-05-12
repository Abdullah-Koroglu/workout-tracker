import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAuth } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";

const patchSchema = z.object({
  status: z.enum(["SCHEDULED", "COMPLETED", "CANCELLED"]).optional(),
  notes: z.string().max(500).optional(),
  meetingUrl: z.string().url().max(1000).nullable().optional(),
  recordingUrl: z.string().url().max(1000).nullable().optional(),
  agenda: z.string().max(2000).nullable().optional(),
  summary: z.string().max(2000).nullable().optional(),
  clientFeedback: z.string().max(2000).nullable().optional(),
  rating: z.number().int().min(1).max(5).nullable().optional(),
  isPaid: z.boolean().optional(),
});

// PATCH /api/sessions/[id]
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth();
  if ("error" in auth) return auth.error;

  const { id } = await params;
  const body = await request.json();
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const session = await prisma.session.findUnique({ where: { id } });
  if (!session) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const userId = auth.session.user.id;
  if (session.coachId !== userId && session.clientId !== userId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const isCoach = session.coachId === userId;
  const d = parsed.data;
  const updated = await prisma.session.update({
    where: { id },
    data: {
      ...(d.status !== undefined ? { status: d.status } : {}),
      ...(d.notes !== undefined ? { notes: d.notes } : {}),
      ...(isCoach && d.meetingUrl !== undefined ? { meetingUrl: d.meetingUrl } : {}),
      ...(isCoach && d.recordingUrl !== undefined ? { recordingUrl: d.recordingUrl } : {}),
      ...(isCoach && d.agenda !== undefined ? { agenda: d.agenda } : {}),
      ...(isCoach && d.summary !== undefined ? { summary: d.summary } : {}),
      ...(isCoach && d.isPaid !== undefined ? { isPaid: d.isPaid } : {}),
      ...(!isCoach && d.clientFeedback !== undefined ? { clientFeedback: d.clientFeedback } : {}),
      ...(!isCoach && d.rating !== undefined ? { rating: d.rating } : {}),
    },
  });

  return NextResponse.json({ session: updated });
}

// DELETE /api/sessions/[id]
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth();
  if ("error" in auth) return auth.error;

  const { id } = await params;
  const session = await prisma.session.findUnique({ where: { id } });
  if (!session) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const userId = auth.session.user.id;
  if (session.coachId !== userId && session.clientId !== userId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await prisma.session.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}

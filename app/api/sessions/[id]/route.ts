import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import { requireAuth } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";

const patchSchema = z.object({
  status: z.enum(["SCHEDULED", "COMPLETED", "CANCELLED"]).optional(),
  notes: z.string().max(500).optional(),
  meetingUrl: z.string().url().max(1000).nullable().optional(),
  rtcProvider: z.string().max(100).nullable().optional(),
  rtcRoomId: z.string().max(200).nullable().optional(),
  rtcCallStatus: z.enum(["NOT_CONFIGURED", "READY", "LIVE", "ENDED"]).optional(),
  providerRoomCode: z.string().max(200).nullable().optional(),
  providerHostUserId: z.string().max(200).nullable().optional(),
  callMode: z.enum(["AUDIO", "VIDEO"]).optional(),
  callStatus: z.enum(["SCHEDULED", "PROVISIONING", "READY", "LIVE", "ENDED", "FAILED"]).optional(),
  syncState: z.enum(["PENDING", "SYNCED", "ERROR"]).optional(),
  recordingStatus: z.enum(["NOT_REQUESTED", "PENDING", "READY", "FAILED"]).optional(),
  recordingUrl: z.string().url().max(1000).nullable().optional(),
  agenda: z.string().max(2000).nullable().optional(),
  summary: z.string().max(2000).nullable().optional(),
  clientFeedback: z.string().max(2000).nullable().optional(),
  rating: z.number().int().min(1).max(5).nullable().optional(),
  isPaid: z.boolean().optional(),
  startedAt: z.string().datetime().nullable().optional(),
  endedAt: z.string().datetime().nullable().optional(),
  providerMetadata: z.record(z.string(), z.unknown()).nullable().optional(),
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
  const providerMetadataUpdate =
    isCoach && d.providerMetadata !== undefined
      ? d.providerMetadata === null
        ? Prisma.JsonNull
        : (d.providerMetadata as Prisma.InputJsonValue)
      : undefined;

  const updated = await prisma.session.update({
    where: { id },
    data: {
      ...(d.status !== undefined ? { status: d.status } : {}),
      ...(d.notes !== undefined ? { notes: d.notes } : {}),
      ...(isCoach && d.meetingUrl !== undefined ? { meetingUrl: d.meetingUrl } : {}),
      ...(isCoach && d.rtcProvider !== undefined ? { rtcProvider: d.rtcProvider } : {}),
      ...(isCoach && d.rtcRoomId !== undefined ? { rtcRoomId: d.rtcRoomId } : {}),
      ...(isCoach && d.rtcCallStatus !== undefined ? { rtcCallStatus: d.rtcCallStatus } : {}),
      ...(isCoach && d.providerRoomCode !== undefined ? { providerRoomCode: d.providerRoomCode } : {}),
      ...(isCoach && d.providerHostUserId !== undefined ? { providerHostUserId: d.providerHostUserId } : {}),
      ...(isCoach && d.callMode !== undefined ? { callMode: d.callMode } : {}),
      ...(isCoach && d.callStatus !== undefined ? { callStatus: d.callStatus } : {}),
      ...(isCoach && d.syncState !== undefined ? { syncState: d.syncState } : {}),
      ...(isCoach && d.recordingStatus !== undefined ? { recordingStatus: d.recordingStatus } : {}),
      ...(isCoach && d.recordingUrl !== undefined ? { recordingUrl: d.recordingUrl } : {}),
      ...(isCoach && d.startedAt !== undefined ? { startedAt: d.startedAt ? new Date(d.startedAt) : null } : {}),
      ...(isCoach && d.endedAt !== undefined ? { endedAt: d.endedAt ? new Date(d.endedAt) : null } : {}),
      ...(providerMetadataUpdate !== undefined ? { providerMetadata: providerMetadataUpdate } : {}),
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

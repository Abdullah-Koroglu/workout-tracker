import { NextResponse } from "next/server";

import { requireCallInviteParticipant } from "@/lib/call-invite";
import { emitCallStatusEvent, notifyCallAccepted } from "@/lib/call-notifications";
import { prisma } from "@/lib/prisma";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const access = await requireCallInviteParticipant(id);
  if ("error" in access) return access.error;

  if (access.actorRole !== "CALLEE") {
    return NextResponse.json({ error: "Only the callee can accept" }, { status: 403 });
  }

  if (access.invite.status !== "RINGING") {
    return NextResponse.json({ error: "This call can no longer be accepted" }, { status: 409 });
  }

  if (access.invite.expiresAt.getTime() <= Date.now()) {
    await prisma.callInvite.update({
      where: { id },
      data: { status: "MISSED", endedAt: new Date() },
    });
    return NextResponse.json({ error: "Call expired" }, { status: 409 });
  }

  const invite = await prisma.callInvite.update({
    where: { id },
    data: {
      status: "ACCEPTED",
      acceptedAt: new Date(),
      startedAt: new Date(),
    },
    include: {
      caller: { select: { id: true, name: true, role: true } },
      callee: { select: { id: true, name: true, role: true } },
    },
  });

  await Promise.all([
    emitCallStatusEvent(invite.callerId, "call_accepted", {
      id: invite.id,
      calleeId: invite.calleeId,
      calleeName: invite.callee.name,
      mode: invite.type,
    }),
    notifyCallAccepted(invite),
  ]);

  return NextResponse.json({ call: invite });
}

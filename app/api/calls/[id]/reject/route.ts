import { NextResponse } from "next/server";

import { requireCallInviteParticipant } from "@/lib/call-invite";
import { emitCallStatusEvent, notifyCallRejected } from "@/lib/call-notifications";
import { prisma } from "@/lib/prisma";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const access = await requireCallInviteParticipant(id);
  if ("error" in access) return access.error;

  if (access.actorRole !== "CALLEE") {
    return NextResponse.json({ error: "Only the callee can reject" }, { status: 403 });
  }

  if (access.invite.status !== "RINGING") {
    return NextResponse.json({ error: "This call can no longer be rejected" }, { status: 409 });
  }

  const invite = await prisma.callInvite.update({
    where: { id },
    data: {
      status: "REJECTED",
      endedAt: new Date(),
    },
    include: {
      caller: { select: { id: true, name: true, role: true } },
      callee: { select: { id: true, name: true, role: true } },
    },
  });

  await Promise.all([
    emitCallStatusEvent(invite.callerId, "call_rejected", {
      id: invite.id,
      calleeId: invite.calleeId,
      calleeName: invite.callee.name,
    }),
    notifyCallRejected(invite),
  ]);

  return NextResponse.json({ call: invite });
}

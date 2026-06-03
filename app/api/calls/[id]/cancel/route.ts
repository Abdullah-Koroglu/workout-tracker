import { NextResponse } from "next/server";

import { requireCallInviteParticipant } from "@/lib/call-invite";
import { emitWsEvent } from "@/lib/notify-ws";
import { prisma } from "@/lib/prisma";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const access = await requireCallInviteParticipant(id);
  if ("error" in access) return access.error;

  if (access.actorRole !== "CALLER") {
    return NextResponse.json({ error: "Only the caller can cancel" }, { status: 403 });
  }

  if (access.invite.status !== "RINGING") {
    return NextResponse.json({ error: "This call can no longer be cancelled" }, { status: 409 });
  }

  const invite = await prisma.callInvite.update({
    where: { id },
    data: {
      status: "CANCELLED",
      endedAt: new Date(),
    },
    include: {
      caller: { select: { id: true, name: true, role: true } },
      callee: { select: { id: true, name: true, role: true } },
    },
  });

  await emitWsEvent(invite.calleeId, {
    type: "call_cancelled",
    call: {
      id: invite.id,
      callerId: invite.callerId,
      callerName: invite.caller.name,
    },
  });

  return NextResponse.json({ call: invite });
}

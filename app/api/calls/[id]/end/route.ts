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

  if (!["ACCEPTED", "RINGING"].includes(access.invite.status)) {
    return NextResponse.json({ error: "This call is already closed" }, { status: 409 });
  }

  const invite = await prisma.callInvite.update({
    where: { id },
    data: {
      status: "ENDED",
      endedAt: new Date(),
    },
    include: {
      caller: { select: { id: true, name: true, role: true } },
      callee: { select: { id: true, name: true, role: true } },
    },
  });

  const otherUserId = access.actorRole === "CALLER" ? invite.calleeId : invite.callerId;
  await emitWsEvent(otherUserId, {
    type: "call_ended",
    call: {
      id: invite.id,
      endedBy: access.auth.session.user.id,
    },
  });

  return NextResponse.json({ call: invite });
}

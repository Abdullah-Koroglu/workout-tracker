import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";

import { requireCallInviteParticipant } from "@/lib/call-invite";
import { emitWsEvent } from "@/lib/notify-ws";
import { prisma } from "@/lib/prisma";
import { sendPushNotification } from "@/lib/push-notifications";

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

  await emitWsEvent(invite.callerId, {
    type: "call_rejected",
    call: {
      id: invite.id,
      calleeId: invite.calleeId,
      calleeName: invite.callee.name,
    },
  });

  const callerWithPush = await prisma.user.findUnique({
    where: { id: invite.callerId },
    select: { pushSubscription: true },
  });

  const pushResult = await sendPushNotification(callerWithPush?.pushSubscription, {
    title: `${invite.callee.name} cagriyi reddetti`,
    body: "Gorusme baslatilamadi.",
    url: `/calls/${invite.id}`,
    tag: `call-rejected-${invite.id}`,
  });

  if (pushResult.expired) {
    await prisma.user.update({
      where: { id: invite.callerId },
      data: { pushSubscription: Prisma.DbNull },
    });
  }

  return NextResponse.json({ call: invite });
}

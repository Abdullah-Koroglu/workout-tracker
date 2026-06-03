import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { z } from "zod";

import { requireAuth } from "@/lib/api-auth";
import { assertNoActiveCallForUsers, getCallInviteExpiry, validateCallPeerAccess } from "@/lib/call-invite";
import { emitWsEvent } from "@/lib/notify-ws";
import { prisma } from "@/lib/prisma";
import { provisionCallInviteRoom } from "@/lib/rtc-provider";
import { sendPushNotification } from "@/lib/push-notifications";

const startCallSchema = z.object({
  targetUserId: z.string().min(1),
  mode: z.enum(["AUDIO", "VIDEO"]),
  sessionId: z.string().min(1).optional(),
});

export async function POST(request: Request) {
  const auth = await requireAuth();
  if ("error" in auth) return auth.error;

  const body = await request.json();
  const parsed = startCallSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const callerId = auth.session.user.id;
  const callerRole = auth.session.user.role;
  const { targetUserId, mode, sessionId } = parsed.data;

  if (targetUserId === callerId) {
    return NextResponse.json({ error: "Kendinizi arayamazsiniz" }, { status: 400 });
  }

  const hasAccess = await validateCallPeerAccess({
    callerId,
    callerRole,
    calleeId: targetUserId,
  });

  if (!hasAccess) {
    return NextResponse.json({ error: "Bu kullaniciyi arama yetkiniz yok" }, { status: 403 });
  }

  const noActiveCall = await assertNoActiveCallForUsers([callerId, targetUserId]);
  if (!noActiveCall) {
    return NextResponse.json({ error: "Taraflardan biri zaten aktif bir gorusmede" }, { status: 409 });
  }

  const created = await prisma.callInvite.create({
    data: {
      callerId,
      calleeId: targetUserId,
      sessionId,
      type: mode,
      status: "RINGING",
      rtcProvider: "link",
      expiresAt: getCallInviteExpiry(),
      metadata: {
        startedFrom: "messages",
        callerRole,
      },
    },
    include: {
      caller: { select: { id: true, name: true, role: true } },
      callee: { select: { id: true, name: true, role: true } },
    },
  });

  const invite = await provisionCallInviteRoom(created.id);

  await emitWsEvent(targetUserId, {
    type: "call_incoming",
    call: {
      id: invite.id,
      callerId: invite.callerId,
      callerName: invite.caller.name,
      calleeId: invite.calleeId,
      mode: invite.type,
      status: invite.status,
      expiresAt: invite.expiresAt.toISOString(),
      sessionId: invite.sessionId,
    },
  });

  const calleeWithPush = await prisma.user.findUnique({
    where: { id: targetUserId },
    select: { pushSubscription: true },
  });

  const pushResult = await sendPushNotification(calleeWithPush?.pushSubscription, {
    title: `${invite.caller.name} ariyor`,
    body: invite.type === "AUDIO" ? "Sesli gorusme daveti" : "Goruntulu gorusme daveti",
    url: `/calls/${invite.id}`,
    tag: `incoming-call-${invite.id}`,
    requireInteraction: true,
    vibrate: [200, 120, 200, 120, 200],
  });

  if (pushResult.expired) {
    await prisma.user.update({
      where: { id: targetUserId },
      data: { pushSubscription: Prisma.DbNull },
    });
  }

  return NextResponse.json({ call: invite }, { status: 201 });
}

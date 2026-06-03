import { NextResponse } from "next/server";
import { z } from "zod";

import { requireAuth } from "@/lib/api-auth";
import { assertNoActiveCallForUsers, getCallInviteExpiry, validateCallPeerAccess } from "@/lib/call-invite";
import { emitCallStatusEvent, notifyIncomingCall } from "@/lib/call-notifications";
import { prisma } from "@/lib/prisma";
import { provisionCallInviteRoom } from "@/lib/rtc-provider";

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

  await emitCallStatusEvent(targetUserId, "call_incoming", {
    id: invite.id,
    callerId: invite.callerId,
    callerName: invite.caller.name,
    calleeId: invite.calleeId,
    mode: invite.type,
    status: invite.status,
    expiresAt: invite.expiresAt.toISOString(),
    sessionId: invite.sessionId,
  });
  await notifyIncomingCall(invite);

  return NextResponse.json({ call: invite }, { status: 201 });
}

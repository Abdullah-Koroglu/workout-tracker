import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { mintRtcToken, syncSessionRoom } from "@/lib/rtc-provider";
import { isJoinAllowed, requireSessionParticipant } from "@/lib/session-rtc-access";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const access = await requireSessionParticipant(id);
  if ("error" in access) return access.error;

  if (access.session.callStatus === "ENDED" || access.session.status === "CANCELLED") {
    return NextResponse.json({ error: "This session is closed" }, { status: 409 });
  }

  if (!isJoinAllowed(access.session.scheduledFor)) {
    return NextResponse.json({ error: "Join window is not open yet" }, { status: 409 });
  }

  const tokenResult = await mintRtcToken({
    sessionId: id,
    fitcoachUserId: access.auth.session.user.id,
    role: access.auth.session.user.role,
  });

  await prisma.sessionParticipant.update({
    where: {
      sessionId_userId: {
        sessionId: id,
        userId: access.auth.session.user.id,
      },
    },
    data: {
      joinState: "JOINED",
      joinedAt: new Date(),
      leftAt: null,
    },
  });

  await syncSessionRoom(id);

  return NextResponse.json({
    roomCode: tokenResult.roomCode,
    token: tokenResult.token,
    expiresAt: tokenResult.expiresAt,
    joinUrl: tokenResult.joinUrl,
    callMode: access.session.callMode,
    media: tokenResult.media,
  });
}

import { NextResponse } from "next/server";

import { requireCallInviteParticipant } from "@/lib/call-invite";
import { mintCallInviteToken } from "@/lib/rtc-provider";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const access = await requireCallInviteParticipant(id);
  if ("error" in access) return access.error;

  if (access.invite.status !== "ACCEPTED") {
    return NextResponse.json({ error: "Call is not ready to join" }, { status: 409 });
  }

  const tokenResult = await mintCallInviteToken({
    callInviteId: id,
    fitcoachUserId: access.auth.session.user.id,
    role: access.auth.session.user.role,
  });

  return NextResponse.json({
    roomCode: tokenResult.roomCode,
    token: tokenResult.token,
    expiresAt: tokenResult.expiresAt,
    joinUrl: tokenResult.joinUrl,
    callMode: access.invite.type,
    media: tokenResult.media,
  });
}

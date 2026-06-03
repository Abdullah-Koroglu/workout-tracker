import { NextResponse } from "next/server";

import { endSessionRoom } from "@/lib/rtc-provider";
import { requireSessionParticipant } from "@/lib/session-rtc-access";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const access = await requireSessionParticipant(id);
  if ("error" in access) return access.error;

  if (access.participant.role !== "COACH") {
    return NextResponse.json({ error: "Only the coach can end the session" }, { status: 403 });
  }

  const session = await endSessionRoom(id);
  return NextResponse.json({ session });
}

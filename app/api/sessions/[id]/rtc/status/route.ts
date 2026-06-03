import { NextResponse } from "next/server";

import { getSessionRoom } from "@/lib/rtc-provider";
import { requireSessionParticipant } from "@/lib/session-rtc-access";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const access = await requireSessionParticipant(id);
  if ("error" in access) return access.error;

  const { session, snapshot } = await getSessionRoom(id);
  return NextResponse.json({ session, snapshot });
}

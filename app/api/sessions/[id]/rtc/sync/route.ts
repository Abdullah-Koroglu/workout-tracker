import { NextResponse } from "next/server";

import { syncSessionRoom } from "@/lib/rtc-provider";
import { requireSessionParticipant } from "@/lib/session-rtc-access";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const access = await requireSessionParticipant(id);
  if ("error" in access) return access.error;

  const session = await syncSessionRoom(id);
  return NextResponse.json({ session });
}

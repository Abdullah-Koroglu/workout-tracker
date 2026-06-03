import { NextResponse } from "next/server";

import { requireCallInviteParticipant } from "@/lib/call-invite";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const access = await requireCallInviteParticipant(id);
  if ("error" in access) return access.error;

  return NextResponse.json({ call: access.invite, actorRole: access.actorRole });
}

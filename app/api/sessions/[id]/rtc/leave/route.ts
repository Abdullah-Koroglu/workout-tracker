import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { requireSessionParticipant } from "@/lib/session-rtc-access";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const access = await requireSessionParticipant(id);
  if ("error" in access) return access.error;

  await prisma.sessionParticipant.update({
    where: {
      sessionId_userId: {
        sessionId: id,
        userId: access.auth.session.user.id,
      },
    },
    data: {
      joinState: "LEFT",
      leftAt: new Date(),
    },
  });

  return NextResponse.json({ ok: true });
}

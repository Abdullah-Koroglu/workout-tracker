import { NextResponse } from "next/server";
import type { SessionParticipant, Session, User } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/api-auth";

export async function requireSessionParticipant(sessionId: string) {
  const authResult = await requireAuth();
  if ("error" in authResult) return { error: authResult.error };

  const session = await prisma.session.findUnique({
    where: { id: sessionId },
    include: {
      participants: true,
      coach: { select: { id: true, name: true } },
      client: { select: { id: true, name: true } },
    },
  });

  if (!session) {
    return { error: NextResponse.json({ error: "Session not found" }, { status: 404 }) };
  }

  const userId = authResult.session.user.id;
  const participant = session.participants.find((item) => item.userId === userId);
  if (!participant) {
    return { error: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  }

  return {
    session,
    participant: participant as SessionParticipant,
    auth: authResult,
  } as {
    session: Session & {
      participants: SessionParticipant[];
      coach: Pick<User, "id" | "name">;
      client: Pick<User, "id" | "name">;
    };
    participant: SessionParticipant;
    auth: typeof authResult;
  };
}

export function getJoinWindowMinutes() {
  return Number(process.env.RTC_JOIN_WINDOW_MINUTES ?? "10");
}

export function isJoinAllowed(scheduledFor: Date) {
  const joinWindowMinutes = getJoinWindowMinutes();
  const sessionTime = scheduledFor.getTime();
  const now = Date.now();
  return now >= sessionTime - joinWindowMinutes * 60 * 1000;
}

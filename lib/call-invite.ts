import { NextResponse } from "next/server";
import type { CallInvite, SessionCallMode, User } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/api-auth";

const ACTIVE_CALL_STATUSES = ["RINGING", "ACCEPTED"] as const;

export function getCallRingTimeoutSeconds() {
  return Number(process.env.RTC_CALL_RING_TIMEOUT_SECONDS ?? "30");
}

export function getCallInviteExpiry() {
  return new Date(Date.now() + getCallRingTimeoutSeconds() * 1000);
}

export async function validateCallPeerAccess(input: {
  callerId: string;
  callerRole: "COACH" | "CLIENT";
  calleeId: string;
}) {
  const relation = await prisma.coachClientRelation.findFirst({
    where:
      input.callerRole === "COACH"
        ? { coachId: input.callerId, clientId: input.calleeId, status: "ACCEPTED" }
        : { coachId: input.calleeId, clientId: input.callerId, status: "ACCEPTED" },
  });

  return Boolean(relation);
}

export async function assertNoActiveCallForUsers(userIds: string[]) {
  const existing = await prisma.callInvite.findFirst({
    where: {
      status: { in: [...ACTIVE_CALL_STATUSES] },
      OR: userIds.flatMap((userId) => [{ callerId: userId }, { calleeId: userId }]),
    },
    select: { id: true },
  });

  return !existing;
}

export async function expireStaleInvite(inviteId: string) {
  const invite = await prisma.callInvite.findUnique({
    where: { id: inviteId },
    select: { id: true, status: true, expiresAt: true },
  });

  if (!invite) {
    return null;
  }

  if (invite.status === "RINGING" && invite.expiresAt.getTime() <= Date.now()) {
    await prisma.callInvite.update({
      where: { id: invite.id },
      data: { status: "MISSED", endedAt: new Date() },
    });
    return true;
  }

  return false;
}

export async function requireCallInviteParticipant(callInviteId: string) {
  const authResult = await requireAuth();
  if ("error" in authResult) return { error: authResult.error };

  const invite = await prisma.callInvite.findUnique({
    where: { id: callInviteId },
    include: {
      caller: { select: { id: true, name: true, role: true } },
      callee: { select: { id: true, name: true, role: true } },
      session: { select: { id: true, type: true } },
    },
  });

  if (!invite) {
    return { error: NextResponse.json({ error: "Call not found" }, { status: 404 }) };
  }

  const wasExpired = await expireStaleInvite(callInviteId);
  const resolvedInvite = wasExpired
    ? await prisma.callInvite.findUniqueOrThrow({
        where: { id: callInviteId },
        include: {
          caller: { select: { id: true, name: true, role: true } },
          callee: { select: { id: true, name: true, role: true } },
          session: { select: { id: true, type: true } },
        },
      })
    : invite;

  const userId = authResult.session.user.id;
  if (resolvedInvite.callerId !== userId && resolvedInvite.calleeId !== userId) {
    return { error: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  }

  return {
    auth: authResult,
    invite: resolvedInvite as CallInvite & {
      caller: Pick<User, "id" | "name" | "role">;
      callee: Pick<User, "id" | "name" | "role">;
      session: { id: string; type: string } | null;
    },
    actorRole: resolvedInvite.callerId === userId ? "CALLER" as const : "CALLEE" as const,
  };
}

export function getCallModeLabel(mode: SessionCallMode) {
  return mode === "AUDIO" ? "Sesli" : "Goruntulu";
}

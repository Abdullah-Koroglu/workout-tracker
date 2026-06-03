import { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";

function asProviderMetadata(value: unknown): Prisma.InputJsonValue | typeof Prisma.JsonNull {
  if (value === null || value === undefined) {
    return Prisma.JsonNull;
  }

  return value as Prisma.InputJsonValue;
}

function requiredEnv(name: string) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} is not configured`);
  }
  return value;
}

function getRtcConfig() {
  return {
    provider: process.env.RTC_PROVIDER ?? "link",
    apiBaseUrl: requiredEnv("RTC_API_BASE_URL").replace(/\/$/, ""),
    roomBaseUrl: (process.env.RTC_ROOM_BASE_URL ?? process.env.RTC_API_BASE_URL ?? "").replace(/\/$/, ""),
    signalingUrl: process.env.RTC_SIGNALING_URL?.replace(/\/$/, "") ?? "",
    internalSecret: requiredEnv("RTC_INTERNAL_API_SECRET"),
    tokenTtlSeconds: Number(process.env.RTC_TOKEN_TTL_SECONDS ?? "3600"),
  };
}

async function providerRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const config = getRtcConfig();
  const response = await fetch(`${config.apiBaseUrl}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      "x-internal-secret": config.internalSecret,
      ...(init?.headers ?? {}),
    },
    cache: "no-store",
  });

  if (!response.ok) {
    const body = await response.text().catch(() => "");
    throw new Error(`RTC provider request failed (${response.status}): ${body || response.statusText}`);
  }

  return response.json() as Promise<T>;
}

export async function loadSessionForRtc(sessionId: string) {
  return prisma.session.findUnique({
    where: { id: sessionId },
    include: {
      coach: { select: { id: true, name: true, email: true } },
      client: { select: { id: true, name: true, email: true } },
      participants: {
        include: {
          user: { select: { id: true, name: true, email: true, role: true } },
        },
      },
    },
  });
}

export async function loadCallInviteForRtc(callInviteId: string) {
  return prisma.callInvite.findUnique({
    where: { id: callInviteId },
    include: {
      caller: { select: { id: true, name: true, email: true, role: true } },
      callee: { select: { id: true, name: true, email: true, role: true } },
      session: { select: { id: true, type: true } },
    },
  });
}

function buildProviderSubject(userId: string, role: "COACH" | "CLIENT") {
  return `${role === "COACH" ? "coach" : "client"}:${userId}`;
}

function buildEmbedUrl(roomCode: string, token: string, callMode: "AUDIO" | "VIDEO") {
  const config = getRtcConfig();
  const roomBaseUrl = config.roomBaseUrl || config.signalingUrl;
  const url = new URL(`${roomBaseUrl}/rooms/${roomCode}`);
  url.searchParams.set("token", token);
  url.searchParams.set("mode", callMode.toLowerCase());
  url.searchParams.set("audio", "1");
  url.searchParams.set("video", callMode === "VIDEO" ? "1" : "0");
  return url.toString();
}

function mapProviderStateToLocalStatus(snapshot: Record<string, unknown> | null) {
  if (!snapshot) {
    return { callStatus: "FAILED" as const, syncState: "ERROR" as const };
  }

  const participantCount =
    typeof snapshot.participantCount === "number"
      ? snapshot.participantCount
      : Array.isArray(snapshot.participants)
        ? snapshot.participants.length
        : 0;

  if (participantCount > 0) {
    return { callStatus: "LIVE" as const, syncState: "SYNCED" as const };
  }

  return { callStatus: "READY" as const, syncState: "SYNCED" as const };
}

async function provisionProviderRoom(input: {
  hostFitcoachUserId: string;
  hostRole: "COACH" | "CLIENT";
  metadata: Record<string, unknown>;
}) {
  const payload = {
    type: "private",
    hostUserId: buildProviderSubject(input.hostFitcoachUserId, input.hostRole),
    metadata: input.metadata,
  };

  const created = await providerRequest<{
    roomCode?: string;
    code?: string;
    hostUserId?: string;
    room?: Record<string, unknown>;
  }>("/rooms", {
    method: "POST",
    body: JSON.stringify(payload),
  });

  const roomCode =
    created.roomCode ??
    created.code ??
    (typeof created.room?.roomCode === "string" ? created.room.roomCode : null);

  if (!roomCode) {
    throw new Error("RTC provider did not return a roomCode");
  }

  const hostUserId =
    created.hostUserId ??
    (typeof created.room?.hostUserId === "string" ? created.room.hostUserId : payload.hostUserId);

  return {
    roomCode,
    hostUserId,
    providerMetadata: asProviderMetadata(created.room ?? payload.metadata),
  };
}

async function mintProviderUserToken(input: {
  fitcoachUserId: string;
  role: "COACH" | "CLIENT";
  roomCode: string;
  callMode: "AUDIO" | "VIDEO";
}) {
  const tokenResponse = await providerRequest<{ token?: string; accessToken?: string; expiresAt?: string }>(
    "/auth/login",
    {
      method: "POST",
      body: JSON.stringify({
        subject: buildProviderSubject(input.fitcoachUserId, input.role),
        role: "user",
        ttlSeconds: getRtcConfig().tokenTtlSeconds,
      }),
    },
  );

  const token = tokenResponse.token ?? tokenResponse.accessToken;
  if (!token) {
    throw new Error("RTC provider did not return a token");
  }

  return {
    token,
    expiresAt: tokenResponse.expiresAt ?? null,
    roomCode: input.roomCode,
    joinUrl: buildEmbedUrl(input.roomCode, token, input.callMode),
    media: {
      audio: true,
      video: input.callMode === "VIDEO",
    },
  };
}

export async function provisionSessionRoom(sessionId: string) {
  const session = await loadSessionForRtc(sessionId);
  if (!session) throw new Error("Session not found");

  if (session.providerRoomCode) {
    return session;
  }

  await prisma.session.update({
    where: { id: session.id },
    data: {
      callStatus: "PROVISIONING",
      syncState: "PENDING",
      rtcProvider: "link",
    },
  });

  const provisioned = await provisionProviderRoom({
    hostFitcoachUserId: session.coachId,
    hostRole: "COACH",
    metadata: {
      fitcoachSessionId: session.id,
      coachId: session.coachId,
      clientId: session.clientId,
      callMode: session.callMode,
      scheduledFor: session.scheduledFor.toISOString(),
    },
  });

  return prisma.session.update({
    where: { id: session.id },
    data: {
      rtcProvider: "link",
      providerRoomCode: provisioned.roomCode,
      providerHostUserId: provisioned.hostUserId,
      callStatus: "READY",
      syncState: "SYNCED",
      providerMetadata: provisioned.providerMetadata,
    },
    include: {
      coach: { select: { id: true, name: true, email: true } },
      client: { select: { id: true, name: true, email: true } },
      participants: {
        include: {
          user: { select: { id: true, name: true, email: true, role: true } },
        },
      },
    },
  });
}

export async function getSessionRoom(sessionId: string) {
  const session = await loadSessionForRtc(sessionId);
  if (!session || !session.providerRoomCode) {
    return { session, snapshot: null };
  }

  const snapshot = await providerRequest<Record<string, unknown>>(`/rooms/${session.providerRoomCode}`);
  return { session, snapshot };
}

export async function mintRtcToken(input: {
  sessionId: string;
  fitcoachUserId: string;
  role: "COACH" | "CLIENT";
}) {
  const session = await loadSessionForRtc(input.sessionId);
  if (!session) throw new Error("Session not found");

  const sessionWithRoom = session.providerRoomCode ? session : await provisionSessionRoom(session.id);
  return mintProviderUserToken({
    fitcoachUserId: input.fitcoachUserId,
    role: input.role,
    roomCode: sessionWithRoom.providerRoomCode!,
    callMode: sessionWithRoom.callMode,
  });
}

export async function syncSessionRoom(sessionId: string) {
  const { session, snapshot } = await getSessionRoom(sessionId);
  if (!session) throw new Error("Session not found");

  if (!session.providerRoomCode || !snapshot) {
    return prisma.session.update({
      where: { id: session.id },
      data: { syncState: "ERROR", callStatus: "FAILED" },
    });
  }

  const mapped = mapProviderStateToLocalStatus(snapshot);
  return prisma.session.update({
    where: { id: session.id },
    data: {
      callStatus: mapped.callStatus,
      syncState: mapped.syncState,
      providerMetadata: asProviderMetadata(snapshot),
      startedAt: mapped.callStatus === "LIVE" && !session.startedAt ? new Date() : session.startedAt,
    },
  });
}

export async function endSessionRoom(sessionId: string) {
  const session = await prisma.session.update({
    where: { id: sessionId },
    data: {
      callStatus: "ENDED",
      endedAt: new Date(),
      syncState: "SYNCED",
      status: "COMPLETED",
    },
  });

  return session;
}

export async function provisionCallInviteRoom(callInviteId: string) {
  const invite = await loadCallInviteForRtc(callInviteId);
  if (!invite) throw new Error("Call invite not found");

  if (invite.providerRoomCode) {
    return invite;
  }

  const provisioned = await provisionProviderRoom({
    hostFitcoachUserId: invite.callerId,
    hostRole: invite.caller.role,
    metadata: {
      fitcoachCallInviteId: invite.id,
      callerId: invite.callerId,
      calleeId: invite.calleeId,
      callMode: invite.type,
      sessionId: invite.sessionId,
      createdAt: invite.createdAt.toISOString(),
    },
  });

  return prisma.callInvite.update({
    where: { id: invite.id },
    data: {
      rtcProvider: "link",
      providerRoomCode: provisioned.roomCode,
      providerHostUserId: provisioned.hostUserId,
      metadata: provisioned.providerMetadata,
    },
    include: {
      caller: { select: { id: true, name: true, email: true, role: true } },
      callee: { select: { id: true, name: true, email: true, role: true } },
      session: { select: { id: true, type: true } },
    },
  });
}

export async function mintCallInviteToken(input: {
  callInviteId: string;
  fitcoachUserId: string;
  role: "COACH" | "CLIENT";
}) {
  const invite = await loadCallInviteForRtc(input.callInviteId);
  if (!invite) throw new Error("Call invite not found");

  const inviteWithRoom = invite.providerRoomCode ? invite : await provisionCallInviteRoom(invite.id);

  return mintProviderUserToken({
    fitcoachUserId: input.fitcoachUserId,
    role: input.role,
    roomCode: inviteWithRoom.providerRoomCode!,
    callMode: inviteWithRoom.type,
  });
}

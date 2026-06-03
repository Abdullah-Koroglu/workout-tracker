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
  const signalingUrl = process.env.RTC_SIGNALING_URL?.replace(/\/$/, "") ?? "";
  const signalingInternalUrl =
    (process.env.RTC_SIGNALING_INTERNAL_URL ?? signalingUrl.replace(/^wss?:\/\//, (match) => (match === "wss://" ? "https://" : "http://"))).replace(/\/ws$/, "").replace(/\/$/, "");

  return {
    provider: process.env.RTC_PROVIDER ?? "link",
    apiBaseUrl: requiredEnv("RTC_API_BASE_URL").replace(/\/$/, ""),
    roomBaseUrl: (process.env.RTC_ROOM_BASE_URL ?? process.env.RTC_API_BASE_URL ?? "").replace(/\/$/, ""),
    signalingUrl,
    signalingInternalUrl,
    internalSecret: requiredEnv("RTC_INTERNAL_API_SECRET"),
    tokenTtlSeconds: Number(process.env.RTC_TOKEN_TTL_SECONDS ?? "3600"),
  };
}

async function providerRequest<T>(
  path: string,
  init?: RequestInit,
  options?: { auth?: "internal" | "public"; userId?: string },
): Promise<T> {
  const config = getRtcConfig();
  const authMode = options?.auth ?? "public";
  const response = await fetch(`${config.apiBaseUrl}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(authMode === "internal"
        ? {
            Authorization: `Bearer ${config.internalSecret}`,
            "x-user-id": options?.userId ?? "anonymous",
          }
        : {}),
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

function buildProviderSubject(userId: string) {
  return userId;
}

function buildEmbedUrl(roomCode: string, token: string, callMode: "AUDIO" | "VIDEO") {
  const config = getRtcConfig();
  const roomBaseUrl = config.roomBaseUrl || config.signalingUrl;
  const url = new URL(`${roomBaseUrl}/room/${roomCode}`);
  url.searchParams.set("token", token);
  url.searchParams.set("micEnabled", "true");
  url.searchParams.set("cameraEnabled", callMode === "VIDEO" ? "true" : "false");
  return url.toString();
}

function mapProviderStateToLocalStatus(snapshot: Record<string, unknown> | null) {
  if (!snapshot) {
    return { callStatus: "FAILED" as const, syncState: "ERROR" as const };
  }

  const isExpired = snapshot.isExpired === true;
  const participantCount =
    typeof snapshot.participantCount === "number"
      ? snapshot.participantCount
      : Array.isArray(snapshot.participants)
        ? snapshot.participants.length
        : 0;

  if (isExpired) {
    return { callStatus: "ENDED" as const, syncState: "SYNCED" as const };
  }

  if (participantCount > 0) {
    return { callStatus: "LIVE" as const, syncState: "SYNCED" as const };
  }

  return { callStatus: "READY" as const, syncState: "SYNCED" as const };
}

async function provisionProviderRoom(input: {
  hostFitcoachUserId: string;
  metadata: Record<string, unknown>;
}) {
  const payload = {
    type: "public",
  };

  const created = await providerRequest<{
    id?: string;
    roomCode?: string;
    code?: string;
    hostUserId?: string;
    type?: string;
    isLocked?: boolean;
    isExpired?: boolean;
    expiresAt?: string;
    createdAt?: string;
  }>("/rooms", {
    method: "POST",
    body: JSON.stringify(payload),
  }, {
    auth: "internal",
    userId: buildProviderSubject(input.hostFitcoachUserId),
  });

  const roomCode =
    created.roomCode ??
    created.code;

  if (!roomCode) {
    throw new Error("RTC provider did not return a roomCode");
  }

  const hostUserId = created.hostUserId ?? input.hostFitcoachUserId;

  return {
    roomCode,
    hostUserId,
    providerMetadata: asProviderMetadata({
      fitcoachMetadata: input.metadata,
      providerSnapshot: created,
      providerRoomId: created.id ?? null,
      recordingSupported: false,
    }),
  };
}

async function mintProviderUserToken(input: {
  fitcoachUserId: string;
  role: "COACH" | "CLIENT";
  roomCode: string;
  callMode: "AUDIO" | "VIDEO";
}) {
  const tokenResponse = await providerRequest<{ token?: string; accessToken?: string }>(
    "/auth/login",
    {
      method: "POST",
      body: JSON.stringify({
        subject: buildProviderSubject(input.fitcoachUserId),
        role: "user",
      }),
    },
  );

  const token = tokenResponse.token ?? tokenResponse.accessToken;
  if (!token) {
    throw new Error("RTC provider did not return a token");
  }

  return {
    token,
    expiresAt: null,
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

  const config = getRtcConfig();
  const snapshot = await providerRequest<Record<string, unknown>>(`/rooms/${session.providerRoomCode}`);
  let participants: unknown[] = [];

  if (config.signalingInternalUrl) {
    try {
      const participantsResponse = await fetch(`${config.signalingInternalUrl}/rooms/${session.providerRoomCode}/participants`, {
        cache: "no-store",
      });
      if (participantsResponse.ok) {
        const participantsBody = await participantsResponse.json().catch(() => ({}));
        participants = Array.isArray(participantsBody.participants) ? participantsBody.participants : [];
      }
    } catch {
      participants = [];
    }
  }

  const mergedSnapshot = {
    ...snapshot,
    participants,
    participantCount: participants.length,
  };
  return { session, snapshot: mergedSnapshot };
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

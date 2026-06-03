import type { CallInvite, User } from "@prisma/client";

import { notify } from "@/lib/notify";
import { emitWsEvent } from "@/lib/notify-ws";

type InviteWithUsers = CallInvite & {
  caller: Pick<User, "id" | "name" | "role">;
  callee: Pick<User, "id" | "name" | "role">;
};

function buildCallActionUrl(inviteId: string) {
  return `/calls/${inviteId}`;
}

export async function notifyIncomingCall(invite: InviteWithUsers) {
  await notify({
    userId: invite.calleeId,
    title: `${invite.caller.name} ariyor`,
    body: invite.type === "AUDIO" ? "Sesli gorusme daveti" : "Goruntulu gorusme daveti",
    type: "CALL_INCOMING",
    actionUrl: buildCallActionUrl(invite.id),
    priority: "high",
    channel: "call",
  });
}

export async function notifyCallAccepted(invite: InviteWithUsers) {
  await notify({
    userId: invite.callerId,
    title: `${invite.callee.name} cagriyi kabul etti`,
    body: invite.type === "AUDIO" ? "Sesli gorusme baslamaya hazir" : "Goruntulu gorusme baslamaya hazir",
    type: "CALL_ACCEPTED",
    actionUrl: buildCallActionUrl(invite.id),
    priority: "high",
    channel: "call",
  });
}

export async function notifyCallRejected(invite: InviteWithUsers) {
  await notify({
    userId: invite.callerId,
    title: `${invite.callee.name} cagriyi reddetti`,
    body: "Gorusme baslatilamadi.",
    type: "CALL_REJECTED",
    actionUrl: buildCallActionUrl(invite.id),
    channel: "call",
  });
}

export async function notifyCallCancelled(invite: InviteWithUsers) {
  await notify({
    userId: invite.calleeId,
    title: `${invite.caller.name} aramayi iptal etti`,
    body: "Arama kapanmis durumda.",
    type: "CALL_CANCELLED",
    actionUrl: buildCallActionUrl(invite.id),
    channel: "call",
  });
}

export async function notifyCallEnded(invite: InviteWithUsers, endedByUserId: string) {
  const endedByCaller = endedByUserId === invite.callerId;
  const targetUserId = endedByCaller ? invite.calleeId : invite.callerId;
  const actorName = endedByCaller ? invite.caller.name : invite.callee.name;

  await notify({
    userId: targetUserId,
    title: `${actorName} gorusmeyi sonlandirdi`,
    body: "Cagri tamamlandi.",
    type: "CALL_ENDED",
    actionUrl: buildCallActionUrl(invite.id),
    channel: "call",
  });
}

export async function notifyCallMissed(invite: InviteWithUsers) {
  await Promise.all([
    notify({
      userId: invite.callerId,
      title: `${invite.callee.name} aramayi kacirdi`,
      body: "Arama zaman asimina ugradi ve kacti.",
      type: "CALL_MISSED",
      actionUrl: buildCallActionUrl(invite.id),
      channel: "call",
    }),
    notify({
      userId: invite.calleeId,
      title: `${invite.caller.name} aramasi kacti`,
      body: "Arama zaman asimina ugradi.",
      type: "CALL_MISSED",
      actionUrl: buildCallActionUrl(invite.id),
      channel: "call",
    }),
  ]);
}

export async function emitCallStatusEvent(
  userId: string,
  type: "call_incoming" | "call_accepted" | "call_rejected" | "call_cancelled" | "call_ended" | "call_missed",
  call: Record<string, unknown>,
) {
  await emitWsEvent(userId, { type, call });
}

import { prisma } from "@/lib/prisma";
import { emitNotificationViaWs, notifPayload } from "@/lib/notify-ws";
import { sendPushNotification } from "@/lib/push-notifications";
import { Prisma } from "@prisma/client";

export interface NotifyPayload {
  userId: string;
  title: string;
  body: string;
  type: string;
  actionUrl?: string;
  priority?: "low" | "normal" | "high";
  channel?: string;
}

export async function notify(payload: NotifyPayload) {
  const notif = await prisma.notification.create({
    data: {
      userId: payload.userId,
      title: payload.title,
      body: payload.body,
      type: payload.type,
      actionUrl: payload.actionUrl ?? null,
      priority: payload.priority ?? "normal",
      channel: payload.channel ?? "inapp",
    },
  });

  // Emit via WebSocket (best-effort)
  void emitNotificationViaWs(payload.userId, notifPayload(notif));

  // Push notification (best-effort)
  try {
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: { pushSubscription: true },
    });
    const pushResult = await sendPushNotification(user?.pushSubscription, {
      title: payload.title,
      body: payload.body,
      url: payload.actionUrl ?? "/",
    });
    if (pushResult.expired) {
      await prisma.user.update({
        where: { id: payload.userId },
        data: { pushSubscription: Prisma.DbNull },
      });
    }
  } catch { /* non-fatal */ }

  return notif;
}

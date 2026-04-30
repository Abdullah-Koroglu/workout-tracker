import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";
import { z } from "zod";

import { requireAuth } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import { emitNotificationViaWs, notifPayload } from "@/lib/notify-ws";
import { sendPushNotification } from "@/lib/push-notifications";

const schema = z.object({
  content: z.string().min(1).max(1000),
  clientIds: z.array(z.string()).optional(), // empty = all accepted clients
});

export async function POST(request: Request) {
  const auth = await requireAuth("COACH");
  if (auth.error) return auth.error;

  const body = await request.json().catch(() => ({}));
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { content, clientIds } = parsed.data;
  const coachId = auth.session.user.id;

  const relations = await prisma.coachClientRelation.findMany({
    where: {
      coachId,
      status: "ACCEPTED",
      ...(clientIds?.length ? { clientId: { in: clientIds } } : {}),
    },
    include: {
      client: { select: { id: true, pushSubscription: true, role: true } },
    },
  });

  if (relations.length === 0) {
    return NextResponse.json({ error: "Gönderilecek danışan bulunamadı." }, { status: 400 });
  }

  const senderName = auth.session.user.name ?? "Koçun";

  await Promise.all(
    relations.map(async ({ client }) => {
      const message = await prisma.message.create({
        data: { senderId: coachId, receiverId: client.id, content: content.trim() },
      });

      const notif = await prisma.notification.create({
        data: {
          userId: client.id,
          title: `${senderName} duyuru gönderdi`,
          body: content.slice(0, 140),
          type: "BROADCAST_MESSAGE",
        },
      });

      void emitNotificationViaWs(client.id, notifPayload(notif));

      const pushResult = await sendPushNotification(client.pushSubscription, {
        title: `${senderName} duyuru gönderdi`,
        body: content.slice(0, 140),
        url: `/client/messages?withUserId=${coachId}`,
      });

      if (pushResult.expired) {
        await prisma.user.update({
          where: { id: client.id },
          data: { pushSubscription: Prisma.DbNull },
        });
      }

      return message;
    })
  );

  return NextResponse.json({ sent: relations.length }, { status: 201 });
}

import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";
import { z } from "zod";

import { requireAuth } from "@/lib/api-auth";
import { emitNotificationViaWs, notifPayload } from "@/lib/notify-ws";
import { prisma } from "@/lib/prisma";
import { sendPushNotification } from "@/lib/push-notifications";

const schema = z.object({
  clientIds: z.array(z.string()).optional(),
  message: z.string().min(1).max(200).optional(),
});

function startOfWeek() {
  const now = new Date();
  const start = new Date(now);
  start.setDate(now.getDate() - ((now.getDay() + 6) % 7));
  start.setHours(0, 0, 0, 0);
  return start;
}

async function findNudgeCandidates(coachId: string) {
  const weekStart = startOfWeek();

  const relations = await prisma.coachClientRelation.findMany({
    where: { coachId, status: "ACCEPTED" },
    select: {
      clientId: true,
      client: {
        select: {
          id: true,
          name: true,
          pushSubscription: true,
          workouts: {
            where: { startedAt: { gte: weekStart } },
            select: { id: true },
            take: 1,
          },
        },
      },
    },
  });

  return relations
    .filter((relation) => relation.client.workouts.length === 0)
    .map((relation) => relation.client);
}

export async function GET() {
  const auth = await requireAuth("COACH");
  if (auth.error) return auth.error;

  const candidates = await findNudgeCandidates(auth.session.user.id);

  return NextResponse.json({
    count: candidates.length,
    clients: candidates.map((client) => ({ id: client.id, name: client.name })),
  });
}

export async function POST(request: Request) {
  const auth = await requireAuth("COACH");
  if (auth.error) return auth.error;

  const body = await request.json().catch(() => ({}));
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const coachId = auth.session.user.id;
  const senderName = auth.session.user.name ?? "Koçun";
  const message = parsed.data.message ?? "Seni salonda göremiyorum. Bu hafta ilk antrenmanı birlikte başlatalım.";

  const candidates = await findNudgeCandidates(coachId);
  const targetIds = parsed.data.clientIds?.length
    ? new Set(parsed.data.clientIds)
    : null;

  const targets = targetIds
    ? candidates.filter((client) => targetIds.has(client.id))
    : candidates;

  if (targets.length === 0) {
    return NextResponse.json({ error: "Dürtülecek danışan bulunamadı." }, { status: 400 });
  }

  await Promise.all(
    targets.map(async (client) => {
      const notif = await prisma.notification.create({
        data: {
          userId: client.id,
          title: `${senderName} seni dürttü`,
          body: message,
          type: "COACH_NUDGE",
        },
      });

      void emitNotificationViaWs(client.id, notifPayload(notif));

      const pushResult = await sendPushNotification(client.pushSubscription, {
        title: notif.title,
        body: notif.body,
        url: "/client/workouts",
      });

      if (pushResult.expired) {
        await prisma.user.update({
          where: { id: client.id },
          data: { pushSubscription: Prisma.DbNull },
        });
      }
    })
  );

  return NextResponse.json({ sent: targets.length }, { status: 201 });
}

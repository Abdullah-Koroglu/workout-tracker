import { NextResponse } from "next/server";
import { z } from "zod";

import { requireAuth } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import { emitNotificationViaWs, notifPayload } from "@/lib/notify-ws";
import { sendPushNotification } from "@/lib/push-notifications";
import { Prisma } from "@prisma/client";
import { coachCheckInQuerySchema } from "@/validations/subscription";

const sendSchema = z.object({
  clientIds: z.array(z.string().min(1)).min(1),
  message: z.string().max(500).optional(),
});

// GET: coach's sent check-ins with responses
export async function GET(request: Request) {
  try {
    const auth = await requireAuth("COACH");
    if (auth.error) return auth.error;

    const { searchParams } = new URL(request.url);
    const parsed = coachCheckInQuerySchema.safeParse({
      clientId: searchParams.get("clientId") ?? undefined,
      status: searchParams.get("status") ?? undefined,
      take: searchParams.get("take") ?? undefined,
    });

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const { clientId, status, take } = parsed.data;
    const answeredFilter = status === "answered" ? { isNot: null } : status === "pending" ? null : undefined;

    const checkIns = await prisma.checkIn.findMany({
      where: {
        coachId: auth.session.user.id,
        ...(clientId ? { clientId } : {}),
        ...(status === "answered"
          ? { response: { isNot: null } }
          : status === "pending"
            ? { response: null }
            : {}),
      },
      include: {
        client: { select: { id: true, name: true } },
        response: true,
      },
      orderBy: [{ response: { createdAt: "desc" } }, { createdAt: "desc" }],
      take,
    });

    const summary = {
      total: checkIns.length,
      pending: checkIns.filter((item) => !item.response).length,
      answered: checkIns.filter((item) => Boolean(item.response)).length,
      filter: status,
      clientId: clientId ?? null,
    };

    return NextResponse.json({ checkIns, summary, answeredFilter });
  } catch (error) {
    console.error("[api/coach/checkins] Failed to fetch check-ins", error);
    return NextResponse.json({ error: "Check-in kayıtları alınamadı." }, { status: 500 });
  }
}

// POST: send check-in to one or more clients
export async function POST(request: Request) {
  try {
    const auth = await requireAuth("COACH");
    if (auth.error) return auth.error;

    const body = await request.json().catch(() => ({}));
    const parsed = sendSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const { clientIds, message } = parsed.data;
    const coachId = auth.session.user.id;
    const senderName = auth.session.user.name ?? "Koçun";

    const validRelations = await prisma.coachClientRelation.findMany({
      where: { coachId, clientId: { in: clientIds }, status: "ACCEPTED" },
      include: { client: { select: { id: true, pushSubscription: true } } },
    });

    const created = await Promise.all(
      validRelations.map(async ({ client }) => {
        const checkIn = await prisma.checkIn.create({
          data: { coachId, clientId: client.id, message: message ?? null },
        });

        const notif = await prisma.notification.create({
          data: {
            userId: client.id,
            title: `${senderName} haftalık check-in gönderdi`,
            body: message ?? "Nasıl hissediyorsun? Check-in formunu doldur.",
            type: "CHECKIN_REQUEST",
          },
        });

        void emitNotificationViaWs(client.id, notifPayload(notif));

        const pushResult = await sendPushNotification(client.pushSubscription, {
          title: notif.title,
          body: notif.body,
          url: "/client/dashboard",
        });

        if (pushResult.expired) {
          await prisma.user.update({
            where: { id: client.id },
            data: { pushSubscription: Prisma.DbNull },
          });
        }

        return checkIn;
      }),
    );

    return NextResponse.json({ sent: created.length }, { status: 201 });
  } catch (error) {
    console.error("[api/coach/checkins] Failed to send check-ins", error);
    return NextResponse.json({ error: "Check-in gönderilemedi." }, { status: 500 });
  }
}

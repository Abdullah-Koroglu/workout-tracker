import { Prisma, RelationStatus } from "@prisma/client";
import { NextResponse } from "next/server";

import { requireAuth } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import { emitNotificationViaWs, notifPayload } from "@/lib/notify-ws";
import { sendPushNotification } from "@/lib/push-notifications";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ clientId: string }> }
) {
  const auth = await requireAuth("COACH");
  if (auth.error) return auth.error;

  const { clientId } = await params;
  const body = await request.json();
  const status = body.status as RelationStatus;

  if (!["ACCEPTED", "REJECTED"].includes(status)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  const relation = await prisma.coachClientRelation.upsert({
    where: { coachId_clientId: { coachId: auth.session.user.id, clientId } },
    update: { status },
    create: {
      coachId: auth.session.user.id,
      clientId,
      status
    }
  });

  // Notify the client about acceptance/rejection
  if (status === "ACCEPTED" || status === "REJECTED") {
    const [coach, client] = await Promise.all([
      prisma.user.findUnique({
        where: { id: auth.session.user.id },
        select: { name: true }
      }),
      prisma.user.findUnique({
        where: { id: clientId },
        select: { pushSubscription: true }
      })
    ]);

    const relationNotif = await prisma.notification.create({
      data: {
        userId: clientId,
        title: status === "ACCEPTED" ? "Koç bağlantısı kabul edildi" : "Koç bağlantısı reddedildi",
        body:
          status === "ACCEPTED"
            ? `${coach?.name ?? "Koçun"} koçluk isteğini kabul etti. Artık antrenman atayabilir.`
            : `${coach?.name ?? "Koç"} koçluk isteğini reddetti.`,
        type: status === "ACCEPTED" ? "COACH_ACCEPTED" : "COACH_REJECTED",
      },
    });
    void emitNotificationViaWs(clientId, notifPayload(relationNotif));

    const pushResult = await sendPushNotification(client?.pushSubscription, {
      title: relationNotif.title,
      body: relationNotif.body,
      url: "/client/coaches"
    });

    if (pushResult.expired) {
      await prisma.user.update({
        where: { id: clientId },
        data: { pushSubscription: Prisma.DbNull }
      });
    }
  }

  return NextResponse.json({ relation });
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ clientId: string }> }
) {
  const auth = await requireAuth("COACH");
  if (auth.error) return auth.error;

  const { clientId } = await params;

  const relation = await prisma.coachClientRelation.findUnique({
    where: { coachId_clientId: { coachId: auth.session.user.id, clientId } }
  });

  if (!relation) {
    return NextResponse.json({ error: "İlişki bulunamadı." }, { status: 404 });
  }

  await prisma.templateAssignment.deleteMany({
    where: {
      clientId,
      template: {
        coachId: auth.session.user.id
      },
      workouts: {
        none: {}
      }
    }
  });

  await prisma.coachClientRelation.delete({
    where: { coachId_clientId: { coachId: auth.session.user.id, clientId } }
  });

  return NextResponse.json({ success: true });
}

export async function POST(request: Request, context: { params: Promise<{ clientId: string }> }) {
  return PATCH(request, context);
}

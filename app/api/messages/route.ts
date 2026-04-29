import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";

import { requireAuth } from "@/lib/api-auth";
import { emitNotificationViaWs, notifPayload } from "@/lib/notify-ws";
import { sendPushNotification } from "@/lib/push-notifications";
import { prisma } from "@/lib/prisma";
import { conversationQuerySchema, sendMessageSchema } from "@/validations/message";

export async function GET(request: Request) {
  const auth = await requireAuth();
  if (auth.error) return auth.error;

  const { searchParams } = new URL(request.url);
  const parsed = conversationQuerySchema.safeParse({
    withUserId: searchParams.get("withUserId"),
    cursor: searchParams.get("cursor") ?? undefined,
    limit: searchParams.get("limit") ?? undefined
  });

  if (!parsed.success) {
    return NextResponse.json({ error: "withUserId is required" }, { status: 400 });
  }

  const { withUserId, cursor, limit } = parsed.data;

  // Cursor-based pagination: fetch `limit+1` items sorted desc to detect hasMore,
  // then reverse so the client always receives chronological order.
  const rawMessages = await prisma.message.findMany({
    where: {
      OR: [
        { senderId: auth.session.user.id, receiverId: withUserId },
        { senderId: withUserId, receiverId: auth.session.user.id }
      ],
      ...(cursor ? { createdAt: { lt: new Date(cursor) } } : {})
    },
    orderBy: { createdAt: "desc" },
    take: limit + 1,
    include: {
      sender: { select: { id: true, name: true } },
      receiver: { select: { id: true, name: true } }
    }
  });

  const hasMore = rawMessages.length > limit;
  const page = hasMore ? rawMessages.slice(0, limit) : rawMessages;
  const messages = page.reverse(); // chronological order
  const nextCursor = hasMore ? messages[0].createdAt.toISOString() : null;

  await prisma.message.updateMany({
    where: {
      senderId: withUserId,
      receiverId: auth.session.user.id,
      isRead: false
    },
    data: { isRead: true }
  });

  return NextResponse.json({ messages, nextCursor, hasMore });
}

export async function POST(request: Request) {
  const auth = await requireAuth();
  if (auth.error) return auth.error;

  const body = await request.json().catch(() => ({}));
  const parsed = sendMessageSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  if (parsed.data.receiverId === auth.session.user.id) {
    return NextResponse.json({ error: "Kendine mesaj gonderemezsin" }, { status: 400 });
  }

  const receiver = await prisma.user.findUnique({
    where: { id: parsed.data.receiverId },
    select: { id: true, role: true, pushSubscription: true }
  });

  if (!receiver) {
    return NextResponse.json({ error: "Alici bulunamadi" }, { status: 404 });
  }

  const message = await prisma.message.create({
    data: {
      senderId: auth.session.user.id,
      receiverId: parsed.data.receiverId,
      content: parsed.data.content.trim()
    },
    include: {
      sender: { select: { id: true, name: true } },
      receiver: { select: { id: true, name: true } }
    }
  });

  const notification = await prisma.notification.create({
    data: {
      userId: parsed.data.receiverId,
      title: `${message.sender.name} yeni mesaj gonderdi`,
      body: message.content.slice(0, 140),
      type: "DIRECT_MESSAGE"
    }
  });

  void emitNotificationViaWs(parsed.data.receiverId, notifPayload(notification));

  const receiverMessagesPath = receiver.role === "COACH" ? "/coach/messages" : "/client/messages";

  const pushResult = await sendPushNotification(receiver?.pushSubscription, {
    title: `${message.sender.name} yeni mesaj gonderdi`,
    body: message.content.slice(0, 140),
    url: `${receiverMessagesPath}?withUserId=${auth.session.user.id}`
  });

  if (pushResult.expired) {
    await prisma.user.update({
      where: { id: parsed.data.receiverId },
      data: { pushSubscription: Prisma.DbNull }
    });
  }

  return NextResponse.json({ message }, { status: 201 });
}

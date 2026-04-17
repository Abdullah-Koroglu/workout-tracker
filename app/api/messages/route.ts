import { NextResponse } from "next/server";

import { requireAuth } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import { conversationQuerySchema, sendMessageSchema } from "@/validations/message";

async function hasAcceptedRelation(userId: string, otherUserId: string) {
  const relation = await prisma.coachClientRelation.findFirst({
    where: {
      status: "ACCEPTED",
      OR: [
        { coachId: userId, clientId: otherUserId },
        { coachId: otherUserId, clientId: userId }
      ]
    },
    select: { id: true }
  });

  return Boolean(relation);
}

export async function GET(request: Request) {
  const auth = await requireAuth();
  if (auth.error) return auth.error;

  const { searchParams } = new URL(request.url);
  const parsed = conversationQuerySchema.safeParse({
    withUserId: searchParams.get("withUserId")
  });

  if (!parsed.success) {
    return NextResponse.json({ error: "withUserId is required" }, { status: 400 });
  }

  const withUserId = parsed.data.withUserId;
  const isRelated = await hasAcceptedRelation(auth.session.user.id, withUserId);

  if (!isRelated) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const messages = await prisma.message.findMany({
    where: {
      OR: [
        { senderId: auth.session.user.id, receiverId: withUserId },
        { senderId: withUserId, receiverId: auth.session.user.id }
      ]
    },
    orderBy: { createdAt: "asc" },
    include: {
      sender: { select: { id: true, name: true } },
      receiver: { select: { id: true, name: true } }
    },
    take: 300
  });

  await prisma.message.updateMany({
    where: {
      senderId: withUserId,
      receiverId: auth.session.user.id,
      isRead: false
    },
    data: { isRead: true }
  });

  return NextResponse.json({ messages });
}

export async function POST(request: Request) {
  const auth = await requireAuth();
  if (auth.error) return auth.error;

  const body = await request.json().catch(() => ({}));
  const parsed = sendMessageSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const isRelated = await hasAcceptedRelation(auth.session.user.id, parsed.data.receiverId);
  if (!isRelated) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
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

  return NextResponse.json({ message }, { status: 201 });
}

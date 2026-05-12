import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAuth } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";

const schema = z.object({ emoji: z.string().min(1).max(8) });

async function ensureAccess(messageId: string, userId: string) {
  const msg = await prisma.message.findUnique({ where: { id: messageId } });
  if (!msg) return null;
  if (msg.senderId !== userId && msg.receiverId !== userId) return null;
  return msg;
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireAuth();
  if ("error" in auth) return auth.error;
  const { id } = await params;
  const msg = await ensureAccess(id, auth.session.user.id);
  if (!msg) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await request.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const reaction = await prisma.messageReaction.upsert({
    where: {
      messageId_userId_emoji: {
        messageId: id,
        userId: auth.session.user.id,
        emoji: parsed.data.emoji,
      },
    },
    create: { messageId: id, userId: auth.session.user.id, emoji: parsed.data.emoji },
    update: {},
  });
  return NextResponse.json({ reaction });
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireAuth();
  if ("error" in auth) return auth.error;
  const { id } = await params;
  const url = new URL(request.url);
  const emoji = url.searchParams.get("emoji");
  if (!emoji) return NextResponse.json({ error: "emoji required" }, { status: 400 });

  await prisma.messageReaction.deleteMany({
    where: { messageId: id, userId: auth.session.user.id, emoji },
  });
  return NextResponse.json({ ok: true });
}

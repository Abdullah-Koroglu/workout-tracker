import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAuth } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";

const schema = z.object({ reply: z.string().min(2).max(1000) });

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireAuth("COACH");
  if ("error" in auth) return auth.error;
  const { id } = await params;
  const review = await prisma.review.findUnique({ where: { id } });
  if (!review) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (review.coachId !== auth.session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const body = await request.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const updated = await prisma.review.update({
    where: { id },
    data: { coachReply: parsed.data.reply, coachReplyAt: new Date() },
  });
  return NextResponse.json({ review: updated });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireAuth("COACH");
  if ("error" in auth) return auth.error;
  const { id } = await params;
  const review = await prisma.review.findUnique({ where: { id } });
  if (!review || review.coachId !== auth.session.user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  await prisma.review.update({
    where: { id },
    data: { coachReply: null, coachReplyAt: null },
  });
  return NextResponse.json({ ok: true });
}

import { NextResponse } from "next/server";

import { requireAuth } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAuth("COACH");
  if (auth.error) return auth.error;

  const { id } = await params;
  const body = await request.json();
  const name = String(body.name ?? "").trim();
  const color = String(body.color ?? "").trim();

  if (name.length < 1) {
    return NextResponse.json({ error: "Kategori adı boş olamaz." }, { status: 400 });
  }

  const existing = await prisma.templateCategory.findFirst({
    where: { id, coachId: auth.session.user.id }
  });

  if (!existing) {
    return NextResponse.json({ error: "Kategori bulunamadı." }, { status: 404 });
  }

  const category = await prisma.templateCategory.update({
    where: { id },
    data: { name, ...(color ? { color } : {}) },
    include: { _count: { select: { templates: true } } }
  });

  return NextResponse.json({ category });
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAuth("COACH");
  if (auth.error) return auth.error;

  const { id } = await params;

  const existing = await prisma.templateCategory.findFirst({
    where: { id, coachId: auth.session.user.id }
  });

  if (!existing) {
    return NextResponse.json({ error: "Kategori bulunamadı." }, { status: 404 });
  }

  await prisma.templateCategory.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}

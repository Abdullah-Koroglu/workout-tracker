import { NextResponse } from "next/server";

import { requireAuth } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const auth = await requireAuth("COACH");
  if (auth.error) return auth.error;

  const categories = await prisma.templateCategory.findMany({
    where: { coachId: auth.session.user.id },
    include: { _count: { select: { templates: true } } },
    orderBy: { createdAt: "asc" }
  });

  return NextResponse.json({ categories });
}

export async function POST(request: Request) {
  const auth = await requireAuth("COACH");
  if (auth.error) return auth.error;

  const body = await request.json();
  const name = String(body.name ?? "").trim();
  const color = String(body.color ?? "#10b981").trim();

  if (name.length < 1) {
    return NextResponse.json({ error: "Kategori adı boş olamaz." }, { status: 400 });
  }

  const category = await prisma.templateCategory.create({
    data: {
      coachId: auth.session.user.id,
      name,
      color
    },
    include: { _count: { select: { templates: true } } }
  });

  return NextResponse.json({ category }, { status: 201 });
}

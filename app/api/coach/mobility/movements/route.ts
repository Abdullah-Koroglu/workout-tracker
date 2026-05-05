import { NextResponse } from "next/server";

import { requireAuth } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import { mobilityMovementCreateSchema } from "@/validations/mobility";

export async function GET() {
  try {
    const auth = await requireAuth("COACH");
    if (auth.error) return auth.error;

    const movements = await prisma.mobilityMovement.findMany({
      where: { coachId: auth.session.user.id },
      orderBy: [{ createdAt: "desc" }],
      select: {
        id: true,
        name: true,
        videoUrl: true,
        description: true,
        createdAt: true,
        updatedAt: true,
        _count: { select: { routineMovements: true } },
      },
    });

    return NextResponse.json({ movements });
  } catch (error) {
    console.error("[api/coach/mobility/movements] Failed to load movements", error);
    return NextResponse.json({ error: "Mobilite hareketleri alınamadı." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const auth = await requireAuth("COACH");
    if (auth.error) return auth.error;

    const body = await request.json().catch(() => null);
    const parsed = mobilityMovementCreateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Geçersiz hareket verisi.", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const movement = await prisma.mobilityMovement.create({
      data: {
        coachId: auth.session.user.id,
        name: parsed.data.name,
        videoUrl: parsed.data.videoUrl ?? null,
        description: parsed.data.description ?? null,
      },
      select: {
        id: true,
        name: true,
        videoUrl: true,
        description: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({ movement }, { status: 201 });
  } catch (error) {
    console.error("[api/coach/mobility/movements] Failed to create movement", error);
    return NextResponse.json({ error: "Mobilite hareketi oluşturulamadı." }, { status: 500 });
  }
}

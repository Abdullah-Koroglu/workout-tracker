import { NextResponse } from "next/server";

import { requireAuth } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import { mobilityMovementUpdateSchema } from "@/validations/mobility";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireAuth("COACH");
    if (auth.error) return auth.error;

    const { id } = await params;
    const body = await request.json().catch(() => null);
    const parsed = mobilityMovementUpdateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Geçersiz hareket güncelleme verisi.", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const existing = await prisma.mobilityMovement.findFirst({
      where: { id, coachId: auth.session.user.id },
      select: { id: true },
    });

    if (!existing) {
      return NextResponse.json({ error: "Mobilite hareketi bulunamadı." }, { status: 404 });
    }

    const movement = await prisma.mobilityMovement.update({
      where: { id },
      data: {
        ...(parsed.data.name !== undefined ? { name: parsed.data.name } : {}),
        ...(parsed.data.videoUrl !== undefined ? { videoUrl: parsed.data.videoUrl } : {}),
        ...(parsed.data.description !== undefined ? { description: parsed.data.description } : {}),
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

    return NextResponse.json({ movement });
  } catch (error) {
    console.error("[api/coach/mobility/movements/[id]] Failed to update movement", error);
    return NextResponse.json({ error: "Mobilite hareketi güncellenemedi." }, { status: 500 });
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireAuth("COACH");
    if (auth.error) return auth.error;

    const { id } = await params;
    const movement = await prisma.mobilityMovement.findFirst({
      where: { id, coachId: auth.session.user.id },
      select: { id: true, _count: { select: { routineMovements: true } } },
    });

    if (!movement) {
      return NextResponse.json({ error: "Mobilite hareketi bulunamadı." }, { status: 404 });
    }

    if (movement._count.routineMovements > 0) {
      return NextResponse.json(
        { error: "Rutine bağlı hareket silinemez. Önce rutinlerden çıkarın." },
        { status: 409 },
      );
    }

    await prisma.mobilityMovement.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[api/coach/mobility/movements/[id]] Failed to delete movement", error);
    return NextResponse.json({ error: "Mobilite hareketi silinemedi." }, { status: 500 });
  }
}

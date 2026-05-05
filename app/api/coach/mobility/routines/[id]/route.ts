import { NextResponse } from "next/server";

import { requireAuth } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import { mobilityRoutineUpdateSchema } from "@/validations/mobility";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireAuth("COACH");
    if (auth.error) return auth.error;

    const { id } = await params;
    const body = await request.json().catch(() => null);
    const parsed = mobilityRoutineUpdateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Geçersiz rutin güncelleme verisi.", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const routine = await prisma.mobilityRoutine.findFirst({
      where: { id, coachId: auth.session.user.id },
      select: { id: true },
    });

    if (!routine) {
      return NextResponse.json({ error: "Mobilite rutini bulunamadı." }, { status: 404 });
    }

    if (parsed.data.movements) {
      const movementIds = parsed.data.movements.map((item) => item.movementId);
      const ownedMovementCount = await prisma.mobilityMovement.count({
        where: {
          coachId: auth.session.user.id,
          id: { in: movementIds },
        },
      });

      if (ownedMovementCount !== movementIds.length) {
        return NextResponse.json(
          { error: "Rutin içinde size ait olmayan mobilite hareketleri var." },
          { status: 400 },
        );
      }
    }

    const updatedRoutine = await prisma.mobilityRoutine.update({
      where: { id },
      data: {
        ...(parsed.data.name !== undefined ? { name: parsed.data.name } : {}),
        ...(parsed.data.description !== undefined ? { description: parsed.data.description } : {}),
        ...(parsed.data.movements
          ? {
              movements: {
                deleteMany: {},
                create: parsed.data.movements.map((item, index) => ({
                  movementId: item.movementId,
                  durationSeconds: item.durationSeconds,
                  order: item.order ?? index,
                })),
              },
            }
          : {}),
      },
      include: {
        movements: {
          orderBy: { order: "asc" },
          select: {
            id: true,
            order: true,
            durationSeconds: true,
            movement: {
              select: {
                id: true,
                name: true,
                videoUrl: true,
                description: true,
              },
            },
          },
        },
      },
    });

    return NextResponse.json({ routine: updatedRoutine });
  } catch (error) {
    console.error("[api/coach/mobility/routines/[id]] Failed to update routine", error);
    return NextResponse.json({ error: "Mobilite rutini güncellenemedi." }, { status: 500 });
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireAuth("COACH");
    if (auth.error) return auth.error;

    const { id } = await params;
    const routine = await prisma.mobilityRoutine.findFirst({
      where: { id, coachId: auth.session.user.id },
      select: { id: true },
    });

    if (!routine) {
      return NextResponse.json({ error: "Mobilite rutini bulunamadı." }, { status: 404 });
    }

    await prisma.mobilityRoutine.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[api/coach/mobility/routines/[id]] Failed to delete routine", error);
    return NextResponse.json({ error: "Mobilite rutini silinemedi." }, { status: 500 });
  }
}

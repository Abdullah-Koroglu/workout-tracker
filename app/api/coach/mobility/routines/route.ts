import { NextResponse } from "next/server";

import { requireAuth } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import { mobilityRoutineCreateSchema } from "@/validations/mobility";

export async function GET() {
  try {
    const auth = await requireAuth("COACH");
    if (auth.error) return auth.error;

    const routines = await prisma.mobilityRoutine.findMany({
      where: { coachId: auth.session.user.id },
      orderBy: [{ createdAt: "desc" }],
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

    return NextResponse.json({ routines });
  } catch (error) {
    console.error("[api/coach/mobility/routines] Failed to load routines", error);
    return NextResponse.json({ error: "Mobilite rutinleri alınamadı." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const auth = await requireAuth("COACH");
    if (auth.error) return auth.error;

    const body = await request.json().catch(() => null);
    const parsed = mobilityRoutineCreateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Geçersiz rutin verisi.", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

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

    const routine = await prisma.mobilityRoutine.create({
      data: {
        coachId: auth.session.user.id,
        name: parsed.data.name,
        description: parsed.data.description ?? null,
        movements: {
          create: parsed.data.movements.map((item, index) => ({
            movementId: item.movementId,
            durationSeconds: item.durationSeconds,
            order: item.order ?? index,
          })),
        },
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

    return NextResponse.json({ routine }, { status: 201 });
  } catch (error) {
    console.error("[api/coach/mobility/routines] Failed to create routine", error);
    return NextResponse.json({ error: "Mobilite rutini oluşturulamadı." }, { status: 500 });
  }
}

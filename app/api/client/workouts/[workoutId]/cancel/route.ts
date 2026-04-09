import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ workoutId: string }> }
) {
  const auth = await requireAuth("CLIENT");
  if (auth.error) return auth.error;

  const { workoutId } = await params;

  const workout = await prisma.workout.findUnique({
    where: { id: workoutId }
  });

  if (!workout) {
    return NextResponse.json({ error: "Antrenman bulunamadı" }, { status: 404 });
  }

  if (workout.clientId !== auth.session.user.id) {
    return NextResponse.json({ error: "Bu antrenmanı iptal etmeye yetkilisi değilsin" }, { status: 403 });
  }

  if (workout.status !== "IN_PROGRESS") {
    return NextResponse.json(
      { error: "Sadece devam etmekte olan antrenmanlar iptal edilebilir" },
      { status: 400 }
    );
  }

  await prisma.workout.delete({
    where: { id: workoutId }
  });

  return NextResponse.json({
    success: true,
    deletedWorkoutId: workoutId
  });
}
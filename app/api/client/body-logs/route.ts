import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const auth = await requireAuth("CLIENT");
  if (auth.error) return auth.error;

  const logs = await prisma.bodyMetricLog.findMany({
    where: { clientId: auth.session.user.id },
    orderBy: { date: "desc" },
    select: {
      id: true,
      date: true,
      weight: true,
      shoulder: true,
      chest: true,
      waist: true,
      hips: true,
      arm: true,
      leg: true,
      frontPhotoUrl: true,
      sidePhotoUrl: true,
      backPhotoUrl: true,
      createdAt: true,
    },
  });

  return NextResponse.json({ logs });
}

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ coachId: string }> }
) {
  const { coachId } = await params;

  const coach = await prisma.user.findUnique({
    where: { id: coachId, role: "COACH" },
    select: {
      id: true,
      name: true,
      coachProfile: {
        select: { bio: true, specialties: true, experienceYears: true },
      },
    },
  });

  if (!coach) {
    return NextResponse.json({ error: "Koç bulunamadı." }, { status: 404 });
  }

  return NextResponse.json({ coach });
}

import { NextResponse } from "next/server";

import { requireAuth } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const auth = await requireAuth("CLIENT");
  if (auth.error) return auth.error;

  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q") || "";

  const coaches = await prisma.user.findMany({
    where: {
      role: "COACH",
      ...(q
        ? {
            name: {
              contains: q
            }
          }
        : {})
    },
    select: {
      id: true,
      name: true,
      email: true,
      coachRelations: {
        where: { clientId: auth.session.user.id },
        select: { status: true },
        take: 1
      }
    },
    take: 50
  });

  return NextResponse.json({
    coaches: coaches.map((coach) => ({
      id: coach.id,
      name: coach.name,
      email: coach.email,
      requestStatus: coach.coachRelations[0]?.status ?? null
    }))
  });
}

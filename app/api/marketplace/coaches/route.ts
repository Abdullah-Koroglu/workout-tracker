import { NextResponse } from "next/server";

import { requireAuth } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";

// GET /api/marketplace/coaches?q=&specialty=
export async function GET(request: Request) {
  const auth = await requireAuth("CLIENT");
  if ('error' in auth) return auth.error;

  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q")?.trim().toLowerCase() ?? "";
  const specialty = searchParams.get("specialty")?.trim().toLowerCase() ?? "";

  const coaches = await prisma.user.findMany({
    where: {
      role: "COACH",
      coachProfile: { isNot: null },
      ...(q ? { name: { contains: q } } : {}),
    },
    select: {
      id: true,
      name: true,
      coachProfile: {
        select: {
          bio: true,
          specialties: true,
          experienceYears: true,
          packages: {
            where: { isActive: true },
            select: { id: true },
          },
        },
      },
    },
    orderBy: { name: "asc" },
    take: 60,
  });

  // Filter by specialty (JSON array search in application layer — SQLite doesn't support JSON query)
  const filtered = coaches.filter((coach) => {
    if (!specialty) return true;
    const specs = coach.coachProfile?.specialties;
    if (!Array.isArray(specs)) return false;
    return specs.some((s: unknown) =>
      typeof s === "string" && s.toLowerCase().includes(specialty)
    );
  });

  return NextResponse.json({ coaches: filtered });
}

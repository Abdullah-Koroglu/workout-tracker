import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";

import { requireAuth } from "@/lib/api-auth";
import { attachCoachAvatars } from "@/lib/coach-avatar";
import { prisma } from "@/lib/prisma";

// GET /api/marketplace/coaches?q=&specialty=&minPrice=&maxPrice=&minExp=&hasPackages=&city=
export async function GET(request: Request) {
  const auth = await requireAuth("CLIENT");
  if ('error' in auth) return auth.error;

  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q")?.trim().toLowerCase() ?? "";
  const specialty = searchParams.get("specialty")?.trim().toLowerCase() ?? "";
  const minPrice = searchParams.get("minPrice") ? Number(searchParams.get("minPrice")) : null;
  const maxPrice = searchParams.get("maxPrice") ? Number(searchParams.get("maxPrice")) : null;
  const minExp = searchParams.get("minExp") ? Number(searchParams.get("minExp")) : null;
  const hasPackages = searchParams.get("hasPackages") === "true";
  const city = searchParams.get("city")?.trim().toLowerCase() ?? "";

  const where: Prisma.UserFindManyArgs["where"] = {
    role: "COACH",
    coachProfile: { isNot: null },
    ...(q ? { name: { contains: q, mode: "insensitive" } } : {}),
    ...(minExp ? { coachProfile: { experienceYears: { gte: minExp } } } : {}),
    ...(hasPackages ? { coachProfile: { packages: { some: { isActive: true } } } } : {}),
  };

  const coaches = await prisma.user.findMany({
    where,
    select: {
      id: true,
      name: true,
      coachProfile: {
        select: {
          bio: true,
          slogan: true,
          accentColor: true,
          transformationPhotos: true,
          specialties: true,
          experienceYears: true,
          city: true,
          rating: true,
          successRate: true,
          reviewCount: true,
          packages: {
            where: { isActive: true },
            select: { id: true, price: true },
          },
        },
      },
    },
    orderBy: { name: "asc" },
    take: 60,
  });

  // Apply client-side filters for specialty, price, and city (JSON/complex filtering)
  const filtered = coaches.filter((coach) => {
    // Specialty filter
    if (specialty) {
      const specs = coach.coachProfile?.specialties;
      if (!Array.isArray(specs)) return false;
      const hasSpecialty = specs.some((s: unknown) =>
        typeof s === "string" && s.toLowerCase().includes(specialty)
      );
      if (!hasSpecialty) return false;
    }

    // Price filter
    if (minPrice !== null || maxPrice !== null) {
      const prices = coach.coachProfile?.packages
        .map((p: any) => p.price)
        .filter((p: any): p is number => p !== null);

      if (!prices || prices.length === 0) {
        // If coach has no packages with prices, exclude them
        return false;
      }

      if (minPrice !== null && !prices.some((p: number) => p >= minPrice)) return false;
      if (maxPrice !== null && !prices.some((p: number) => p <= maxPrice)) return false;
    }

    // City filter
    if (city) {
      const coachCity = coach.coachProfile?.city;
      if (!coachCity || !coachCity.toLowerCase().includes(city)) return false;
    }

    return true;
  });

  const coachesWithAvatar = await attachCoachAvatars(filtered);

  return NextResponse.json({ coaches: coachesWithAvatar });
}

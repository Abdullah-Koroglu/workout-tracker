import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";

import { requireAuth } from "@/lib/api-auth";
import { attachCoachAvatars } from "@/lib/coach-avatar";
import { calculateCoachProfileQuality } from "@/lib/coach-profile-quality";
import { calculateMarketplaceTrustScore } from "@/lib/marketplace-trust";
import { prisma } from "@/lib/prisma";

// GET /api/marketplace/coaches?q=&specialty=&minPrice=&maxPrice=&minExp=&hasPackages=&city=&segment=&verifiedOnly=
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
  const segment = searchParams.get("segment")?.trim() ?? "all";
  const verifiedOnly = searchParams.get("verifiedOnly") === "true";

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
          socialMediaUrl: true,
          videoIntroUrl: true,
          certifications: true,
          isVerified: true,
          responseTimeHours: true,
          totalClientsHelped: true,
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

  const verifiedReviewCounts = await prisma.review.groupBy({
    by: ["coachId"],
    where: {
      coachId: { in: coaches.map((coach) => coach.id) },
      verifiedPurchase: true,
    },
    _count: { _all: true },
  });
  const verifiedReviewCountByCoachId = new Map(
    verifiedReviewCounts.map((item) => [item.coachId, item._count._all])
  );

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
        .map((p: { price: number | null }) => p.price)
        .filter((p: number | null): p is number => p !== null);

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

    if (verifiedOnly && !coach.coachProfile?.isVerified) {
      return false;
    }

    return true;
  });

  const coachesWithAvatar = await attachCoachAvatars(filtered);
  const coachesWithQuality = coachesWithAvatar
    .map((coach) => ({
      ...coach,
      coachProfile: coach.coachProfile
        ? {
            ...coach.coachProfile,
            profileQuality: calculateCoachProfileQuality({
              ...coach.coachProfile,
              rating: coach.coachProfile.rating?.toString() ?? null,
              avatarUrl: coach.avatarUrl,
            }),
            trustScore: calculateMarketplaceTrustScore({
              profileQualityScore: calculateCoachProfileQuality({
                ...coach.coachProfile,
                rating: coach.coachProfile.rating?.toString() ?? null,
                avatarUrl: coach.avatarUrl,
              }).score,
              isVerified: coach.coachProfile.isVerified,
              rating: coach.coachProfile.rating != null ? Number(coach.coachProfile.rating) : null,
              reviewCount: coach.coachProfile.reviewCount,
              verifiedReviewCount: verifiedReviewCountByCoachId.get(coach.id) ?? 0,
              successRate: coach.coachProfile.successRate,
              responseTimeHours: coach.coachProfile.responseTimeHours,
              totalClientsHelped: coach.coachProfile.totalClientsHelped,
              hasTransformationPhotos: Array.isArray(coach.coachProfile.transformationPhotos) && coach.coachProfile.transformationPhotos.length > 0,
              hasPricedPackages: coach.coachProfile.packages.some((pkg) => Number(pkg.price ?? 0) > 0),
            }),
          }
        : null,
    }))
    .filter((coach) => {
      const profile = coach.coachProfile;
      if (!profile) return false;

      const specialties = Array.isArray(profile.specialties)
        ? profile.specialties.map((item) => (typeof item === "string" ? item.toLowerCase() : ""))
        : [];
      const searchableText = [coach.name, profile.bio, profile.slogan, ...specialties]
        .filter((value): value is string => typeof value === "string" && value.length > 0)
        .join(" ")
        .toLowerCase();
      const packagePrices = profile.packages
        .map((pkg) => Number(pkg.price ?? 0))
        .filter((price) => price > 0);
      const minPackagePrice = packagePrices.length > 0 ? Math.min(...packagePrices) : null;
      const trustScore = profile.trustScore?.score ?? 0;

      if (segment === "affordable") {
        return minPackagePrice !== null && minPackagePrice <= 3000;
      }

      if (segment === "performance") {
        return ["performans", "güç", "guc", "sporcu", "kas"].some((token) => searchableText.includes(token));
      }

      if (segment === "transformation") {
        return ["yağ", "yag", "kilo", "dönüşüm", "donusum"].some((token) => searchableText.includes(token));
      }

      if (segment === "highlyRated") {
        return (profile.rating != null && Number(profile.rating) >= 4.8) || trustScore >= 78;
      }

      if (segment === "online") {
        return searchableText.includes("online");
      }

      return true;
    })
    .sort((left, right) => {
      const leftTrust = left.coachProfile?.trustScore.score ?? 0;
      const rightTrust = right.coachProfile?.trustScore.score ?? 0;
      if (rightTrust !== leftTrust) return rightTrust - leftTrust;
      const leftScore = left.coachProfile?.profileQuality.score ?? 0;
      const rightScore = right.coachProfile?.profileQuality.score ?? 0;
      if (rightScore !== leftScore) return rightScore - leftScore;
      return left.name.localeCompare(right.name, "tr");
    });

  return NextResponse.json({ coaches: coachesWithQuality });
}

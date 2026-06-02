import { calculateCoachProfileQuality } from "@/lib/coach-profile-quality";
import { getCoachAvatarUrl } from "@/lib/coach-avatar";
import { calculateMarketplaceTrustScore } from "@/lib/marketplace-trust";
import { prisma } from "@/lib/prisma";

export async function getPublicMarketplace(filters?: {
  q?: string;
  city?: string;
  specialty?: string;
}) {
  const q = filters?.q?.trim().toLowerCase() ?? "";
  const city = filters?.city?.trim().toLowerCase() ?? "";
  const specialty = filters?.specialty?.trim().toLowerCase() ?? "";

  const coaches = await prisma.user.findMany({
    where: {
      role: "COACH",
      coachProfile: {
        is: {
          isAcceptingClients: true,
        },
      },
    },
    select: {
      id: true,
      name: true,
      coachProfile: {
        select: {
          slogan: true,
          bio: true,
          city: true,
          specialties: true,
          transformationPhotos: true,
          rating: true,
          reviewCount: true,
          successRate: true,
          responseTimeHours: true,
          totalClientsHelped: true,
          isVerified: true,
          experienceYears: true,
          packages: {
            where: { isActive: true },
            orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
            select: {
              id: true,
              title: true,
              price: true,
            },
          },
        },
      },
    },
  });

  const verifiedReviewCounts = await prisma.review.groupBy({
    by: ["coachId"],
    where: { verifiedPurchase: true },
    _count: { _all: true },
  });
  const verifiedReviewCountByCoachId = new Map(
    verifiedReviewCounts.map((item) => [item.coachId, item._count._all])
  );

  const withAssets = await Promise.all(
    coaches.map(async (coach) => {
      const avatarUrl = await getCoachAvatarUrl(coach.id);
      const profile = coach.coachProfile;
      if (!profile) return null;

      const transformationPhotos = Array.isArray(profile.transformationPhotos)
        ? profile.transformationPhotos
        : [];
      const specialties = Array.isArray(profile.specialties) ? (profile.specialties as string[]) : [];
      const profileQuality = calculateCoachProfileQuality({
        ...profile,
        rating: profile.rating?.toString() ?? null,
        avatarUrl,
      });
      const trustScore = calculateMarketplaceTrustScore({
        profileQualityScore: profileQuality.score,
        isVerified: profile.isVerified,
        rating: profile.rating != null ? Number(profile.rating) : null,
        reviewCount: profile.reviewCount,
        verifiedReviewCount: verifiedReviewCountByCoachId.get(coach.id) ?? 0,
        successRate: profile.successRate,
        responseTimeHours: profile.responseTimeHours,
        totalClientsHelped: profile.totalClientsHelped,
        hasTransformationPhotos: transformationPhotos.length > 0,
        hasPricedPackages: profile.packages.some((pkg) => Number(pkg.price ?? 0) > 0),
      });

      const searchable = [
        coach.name,
        profile.slogan ?? "",
        profile.bio ?? "",
        profile.city ?? "",
        specialties.join(" "),
      ]
        .join(" ")
        .toLowerCase();

      return {
        id: coach.id,
        name: coach.name,
        avatarUrl,
        coachProfile: {
          ...profile,
          specialties,
          transformationPhotos,
          rating: profile.rating != null ? Number(profile.rating) : null,
          verifiedReviewCount: verifiedReviewCountByCoachId.get(coach.id) ?? 0,
          profileQuality,
          trustScore,
        },
        searchable,
      };
    })
  );

  return withAssets
    .filter((coach): coach is NonNullable<(typeof withAssets)[number]> => Boolean(coach))
    .filter((coach) => {
      if (q && !coach.searchable.includes(q)) return false;
      if (city && !(coach.coachProfile.city ?? "").toLowerCase().includes(city)) return false;
      if (specialty && !coach.coachProfile.specialties.some((item) => item.toLowerCase().includes(specialty))) return false;
      return true;
    })
    .sort((a, b) => b.coachProfile.trustScore.score - a.coachProfile.trustScore.score)
    .slice(0, 24);
}

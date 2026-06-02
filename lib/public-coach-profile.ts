import { getCoachAvatarUrl } from "@/lib/coach-avatar";
import { calculateCoachProfileQuality } from "@/lib/coach-profile-quality";
import { calculateMarketplaceTrustScore } from "@/lib/marketplace-trust";
import { prisma } from "@/lib/prisma";

export async function getPublicCoachProfile(coachId: string) {
  const coach = await prisma.user.findUnique({
    where: { id: coachId, role: "COACH" },
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
          reviewCount: true,
          successRate: true,
          socialMediaUrl: true,
          videoIntroUrl: true,
          languages: true,
          certifications: true,
          education: true,
          hourlyRate: true,
          responseTimeHours: true,
          totalClientsHelped: true,
          beforeAfterStories: true,
          faqs: true,
          isVerified: true,
          isAcceptingClients: true,
          packages: {
            where: { isActive: true },
            orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
            select: {
              id: true,
              title: true,
              price: true,
              isPopular: true,
              description: true,
              features: true,
              durationWeeks: true,
              sessionsIncluded: true,
              maxClients: true,
              discount: true,
              originalPrice: true,
              recurringInterval: true,
            },
          },
        },
      },
    },
  });

  if (!coach || !coach.coachProfile) return null;

  const avatarUrl = await getCoachAvatarUrl(coach.id);
  const verifiedReviewCount = await prisma.review.count({
    where: { coachId: coach.id, verifiedPurchase: true },
  });

  const reviews = await prisma.review.findMany({
    where: { coachId: coach.id },
    orderBy: [{ verifiedPurchase: "desc" }, { helpfulCount: "desc" }, { createdAt: "desc" }],
    take: 6,
    include: {
      client: { select: { name: true } },
    },
  });

  const transformationPhotos = Array.isArray(coach.coachProfile.transformationPhotos)
    ? coach.coachProfile.transformationPhotos
    : [];
  const beforeAfterStories = Array.isArray(coach.coachProfile.beforeAfterStories)
    ? coach.coachProfile.beforeAfterStories
    : [];

  const profileQuality = calculateCoachProfileQuality({
    ...coach.coachProfile,
    rating: coach.coachProfile.rating?.toString() ?? null,
    avatarUrl,
  });

  const trustScore = calculateMarketplaceTrustScore({
    profileQualityScore: profileQuality.score,
    isVerified: coach.coachProfile.isVerified,
    rating: coach.coachProfile.rating != null ? Number(coach.coachProfile.rating) : null,
    reviewCount: coach.coachProfile.reviewCount,
    verifiedReviewCount,
    successRate: coach.coachProfile.successRate,
    responseTimeHours: coach.coachProfile.responseTimeHours,
    totalClientsHelped: coach.coachProfile.totalClientsHelped,
    hasTransformationPhotos: transformationPhotos.length > 0,
    hasPricedPackages: coach.coachProfile.packages.some((pkg) => Number(pkg.price ?? 0) > 0),
  });

  const minPackagePrice = coach.coachProfile.packages
    .map((pkg) => Number(pkg.price ?? 0))
    .filter((value) => value > 0)
    .sort((a, b) => a - b)[0] ?? null;

  return {
    coach,
    avatarUrl,
    verifiedReviewCount,
    reviews: reviews.map((review) => ({
      id: review.id,
      rating: review.rating,
      title: review.title,
      content: review.content,
      isAnon: review.isAnon,
      authorName: review.isAnon ? "Anonim" : review.client.name,
      createdAt: review.createdAt.toISOString(),
      helpfulCount: review.helpfulCount,
      coachReply: review.coachReply,
      coachReplyAt: review.coachReplyAt?.toISOString() ?? null,
      verifiedPurchase: review.verifiedPurchase,
      durationWithCoach: review.durationWithCoach,
    })),
    transformationPhotos,
    beforeAfterStories,
    profileQuality,
    trustScore,
    minPackagePrice,
  };
}

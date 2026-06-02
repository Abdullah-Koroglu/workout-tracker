import { NextResponse } from "next/server";

import { requireAuth } from "@/lib/api-auth";
import { getCoachAvatarUrl } from "@/lib/coach-avatar";
import { calculateCoachProfileQuality } from "@/lib/coach-profile-quality";
import { calculateMarketplaceTrustScore } from "@/lib/marketplace-trust";
import { prisma } from "@/lib/prisma";

// GET /api/marketplace/coaches/[coachId]
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ coachId: string }> }
) {
  const auth = await requireAuth("CLIENT");
  if ('error' in auth) return auth.error;

  const { coachId } = await params;

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
          socialMediaUrl: true,
          city: true,
          rating: true,
          reviewCount: true,
          successRate: true,
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

  if (!coach) {
    return NextResponse.json({ error: "Koç bulunamadı." }, { status: 404 });
  }

  const avatarUrl = await getCoachAvatarUrl(coach.id);
  const verifiedReviewCount = await prisma.review.count({
    where: { coachId: coach.id, verifiedPurchase: true },
  });

  const profileQuality = coach.coachProfile
    ? calculateCoachProfileQuality({
        ...coach.coachProfile,
        rating: coach.coachProfile.rating?.toString() ?? null,
        avatarUrl,
      })
    : null;

  const trustScore = coach.coachProfile && profileQuality
    ? calculateMarketplaceTrustScore({
        profileQualityScore: profileQuality.score,
        isVerified: coach.coachProfile.isVerified,
        rating: coach.coachProfile.rating != null ? Number(coach.coachProfile.rating) : null,
        reviewCount: coach.coachProfile.reviewCount,
        verifiedReviewCount,
        successRate: coach.coachProfile.successRate,
        responseTimeHours: coach.coachProfile.responseTimeHours,
        totalClientsHelped: coach.coachProfile.totalClientsHelped,
        hasTransformationPhotos: Array.isArray(coach.coachProfile.transformationPhotos) && coach.coachProfile.transformationPhotos.length > 0,
        hasPricedPackages: coach.coachProfile.packages.some((pkg) => Number(pkg.price ?? 0) > 0),
      })
    : null;

  return NextResponse.json({
    coach: {
      ...coach,
      avatarUrl,
      coachProfile: coach.coachProfile
        ? {
            ...coach.coachProfile,
            profileQuality,
            trustScore,
            verifiedReviewCount,
          }
        : null,
    },
  });
}

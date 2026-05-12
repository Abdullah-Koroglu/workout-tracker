import { NextResponse } from "next/server";

import { requireAuth } from "@/lib/api-auth";
import { getCoachAvatarUrl } from "@/lib/coach-avatar";
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

  return NextResponse.json({ coach: { ...coach, avatarUrl } });
}

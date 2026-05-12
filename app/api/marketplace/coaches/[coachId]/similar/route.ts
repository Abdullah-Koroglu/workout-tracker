import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/api-auth";
import { attachCoachAvatars } from "@/lib/coach-avatar";
import { prisma } from "@/lib/prisma";

// GET /api/marketplace/coaches/[coachId]/similar
// Returns up to 3 coaches with overlapping specialties, excluding the viewed coach
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ coachId: string }> }
) {
  const auth = await requireAuth("CLIENT");
  if ("error" in auth) return auth.error;

  const { coachId } = await params;

  const target = await prisma.coachProfile.findUnique({
    where: { userId: coachId },
    select: { specialties: true, city: true },
  });

  if (!target) return NextResponse.json({ coaches: [] });

  const targetSpecs = Array.isArray(target.specialties) ? (target.specialties as string[]) : [];

  // Find all coaches except the target
  const candidates = await prisma.user.findMany({
    where: {
      role: "COACH",
      id: { not: coachId },
      coachProfile: { isNot: null },
    },
    select: {
      id: true,
      name: true,
      coachProfile: {
        select: {
          bio: true,
          slogan: true,
          accentColor: true,
          specialties: true,
          experienceYears: true,
          city: true,
          rating: true,
          successRate: true,
          reviewCount: true,
          packages: { where: { isActive: true }, select: { price: true } },
        },
      },
    },
    take: 50,
  });

  // Score by specialty overlap + city match
  const scored = candidates
    .filter((c) => c.coachProfile !== null)
    .map((c) => {
      const specs = Array.isArray(c.coachProfile?.specialties)
        ? (c.coachProfile!.specialties as string[])
        : [];
      const overlap = specs.filter((s) => targetSpecs.includes(s)).length;
      const cityMatch = target.city && c.coachProfile?.city === target.city ? 1 : 0;
      return { coach: c, score: overlap * 2 + cityMatch };
    })
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
    .map((s) => s.coach);

  const withAvatars = await attachCoachAvatars(scored);
  return NextResponse.json({ coaches: withAvatars });
}

import { NextResponse } from "next/server";
import { z } from "zod";

import { requireAuth } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import { getReviewVerificationContext } from "@/lib/review-verification";

const createSchema = z.object({
  coachId: z.string().min(1),
  rating: z.number().min(1).max(5),
  title: z.string().max(100).optional(),
  content: z.string().min(10).max(1000),
  isAnon: z.boolean().optional().default(false),
});

// GET /api/reviews?coachId=...
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const coachId = searchParams.get("coachId");
  if (!coachId) return NextResponse.json({ error: "coachId required" }, { status: 400 });

  const reviews = await prisma.review.findMany({
    where: { coachId },
    orderBy: [{ verifiedPurchase: "desc" }, { helpfulCount: "desc" }, { createdAt: "desc" }],
    include: {
      client: { select: { name: true } },
    },
  });

  return NextResponse.json({
    reviews: reviews.map((review) => ({
      id: review.id,
      rating: review.rating,
      title: review.title,
      content: review.content,
      isAnon: review.isAnon,
      createdAt: review.createdAt,
      authorName: review.isAnon ? "Anonim" : review.client.name,
      helpfulCount: review.helpfulCount,
      coachReply: review.coachReply,
      coachReplyAt: review.coachReplyAt,
      verifiedPurchase: review.verifiedPurchase,
      photos: review.photos ?? null,
      durationWithCoach: review.durationWithCoach,
    })),
  });
}

// POST /api/reviews
export async function POST(request: Request) {
  const auth = await requireAuth("CLIENT");
  if ("error" in auth) return auth.error;

  const body = await request.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { coachId, rating, title, content, isAnon } = parsed.data;

  const coach = await prisma.user.findUnique({
    where: { id: coachId, role: "COACH" },
    select: { id: true },
  });
  if (!coach) return NextResponse.json({ error: "Coach not found" }, { status: 404 });

  const verification = await getReviewVerificationContext(coachId, auth.session.user.id);
  if (!verification.canReview) {
    return NextResponse.json(
      { error: verification.eligibilityReason ?? "Bu koç icin yorum uygunlugu dogrulanamadi." },
      { status: 403 }
    );
  }

  const review = await prisma.review.upsert({
    where: { coachId_clientId: { coachId, clientId: auth.session.user.id } },
    create: {
      coachId,
      clientId: auth.session.user.id,
      rating,
      title,
      content,
      isAnon,
      verifiedPurchase: verification.verifiedPurchase,
      durationWithCoach: verification.durationWithCoach,
    },
    update: {
      rating,
      title,
      content,
      isAnon,
      verifiedPurchase: verification.verifiedPurchase,
      durationWithCoach: verification.durationWithCoach,
    },
  });

  const allReviews = await prisma.review.findMany({
    where: { coachId },
    select: { rating: true },
  });
  const avgRating = allReviews.reduce((sum, item) => sum + item.rating, 0) / allReviews.length;

  await prisma.coachProfile.update({
    where: { userId: coachId },
    data: {
      rating: Math.round(avgRating * 10) / 10,
      reviewCount: allReviews.length,
    },
  });

  return NextResponse.json({ review });
}

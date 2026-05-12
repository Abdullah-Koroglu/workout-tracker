import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAuth } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";

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
    orderBy: { createdAt: "desc" },
    include: {
      client: { select: { name: true } },
    },
  });

  return NextResponse.json({
    reviews: reviews.map((r) => ({
      id: r.id,
      rating: r.rating,
      title: r.title,
      content: r.content,
      isAnon: r.isAnon,
      createdAt: r.createdAt,
      authorName: r.isAnon ? "Anonim" : r.client.name,
      helpfulCount: r.helpfulCount,
      coachReply: r.coachReply,
      coachReplyAt: r.coachReplyAt,
      verifiedPurchase: r.verifiedPurchase,
      photos: r.photos ?? null,
      durationWithCoach: r.durationWithCoach,
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

  // Verify coach exists
  const coach = await prisma.user.findUnique({
    where: { id: coachId, role: "COACH" },
    select: { id: true },
  });
  if (!coach) return NextResponse.json({ error: "Coach not found" }, { status: 404 });

  // Verify client has/had a relation with this coach
  const relation = await prisma.coachClientRelation.findFirst({
    where: { coachId, clientId: auth.session.user.id },
  });
  if (!relation) {
    return NextResponse.json(
      { error: "Sadece bağlı olduğunuz koça yorum yapabilirsiniz" },
      { status: 403 }
    );
  }

  const isAccepted = relation.status === "ACCEPTED";
  const durationWithCoach = Math.max(
    1,
    Math.floor((Date.now() - new Date(relation.createdAt).getTime()) / (1000 * 60 * 60 * 24 * 7)),
  );

  const review = await prisma.review.upsert({
    where: { coachId_clientId: { coachId, clientId: auth.session.user.id } },
    create: {
      coachId,
      clientId: auth.session.user.id,
      rating,
      title,
      content,
      isAnon,
      verifiedPurchase: isAccepted,
      durationWithCoach,
    },
    update: { rating, title, content, isAnon },
  });

  // Update coach profile aggregate rating
  const allReviews = await prisma.review.findMany({
    where: { coachId },
    select: { rating: true },
  });
  const avgRating = allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length;

  await prisma.coachProfile.update({
    where: { userId: coachId },
    data: {
      rating: Math.round(avgRating * 10) / 10,
      reviewCount: allReviews.length,
    },
  });

  return NextResponse.json({ review });
}

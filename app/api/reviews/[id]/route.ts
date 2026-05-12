import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";

// DELETE /api/reviews/[id]
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth("CLIENT");
  if ("error" in auth) return auth.error;

  const { id } = await params;

  const review = await prisma.review.findUnique({
    where: { id },
    select: { clientId: true, coachId: true },
  });
  if (!review) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (review.clientId !== auth.session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await prisma.review.delete({ where: { id } });

  // Recalculate coach aggregate rating
  const allReviews = await prisma.review.findMany({
    where: { coachId: review.coachId },
    select: { rating: true },
  });
  const avgRating =
    allReviews.length > 0
      ? allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length
      : null;

  await prisma.coachProfile.update({
    where: { userId: review.coachId },
    data: {
      rating: avgRating !== null ? Math.round(avgRating * 10) / 10 : null,
      reviewCount: allReviews.length,
    },
  });

  return NextResponse.json({ ok: true });
}

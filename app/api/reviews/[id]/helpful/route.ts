import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireAuth();
  if ("error" in auth) return auth.error;
  const { id } = await params;
  const review = await prisma.review.update({
    where: { id },
    data: { helpfulCount: { increment: 1 } },
  });
  return NextResponse.json({ helpfulCount: review.helpfulCount });
}

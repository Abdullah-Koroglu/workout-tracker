import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const auth = await requireAuth();
  if ("error" in auth) return auth.error;
  const url = new URL(request.url);
  const coachId = url.searchParams.get("coachId") ?? auth.session.user.id;
  const badges = await prisma.coachBadge.findMany({
    where: { coachId },
    orderBy: { awardedAt: "desc" },
  });
  return NextResponse.json({ badges });
}

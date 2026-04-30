import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";

// GET: client's pending (unanswered) check-ins
export async function GET() {
  const auth = await requireAuth("CLIENT");
  if (auth.error) return auth.error;

  const checkIns = await prisma.checkIn.findMany({
    where: {
      clientId: auth.session.user.id,
      response: null,
    },
    include: {
      coach: { select: { id: true, name: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 10,
  });

  return NextResponse.json({ checkIns });
}

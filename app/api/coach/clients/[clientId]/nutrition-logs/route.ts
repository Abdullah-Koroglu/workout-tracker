import { NextResponse } from "next/server";

import { requireAuth } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  _request: Request,
  context: { params: Promise<{ clientId: string }> }
) {
  const auth = await requireAuth("COACH");
  if (auth.error) return auth.error;

  const { clientId } = await context.params;

  const relation = await prisma.coachClientRelation.findFirst({
    where: { coachId: auth.session.user.id, clientId, status: "ACCEPTED" },
    select: { id: true },
  });
  if (!relation) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const logs = await prisma.nutritionMealLog.findMany({
    where: { clientId },
    orderBy: { loggedAt: "desc" },
    take: 30,
  });

  return NextResponse.json({ logs });
}

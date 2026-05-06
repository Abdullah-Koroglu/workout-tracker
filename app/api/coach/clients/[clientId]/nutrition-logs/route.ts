import { NextResponse } from "next/server";

import { requireAuth } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import { uploadUrlExists } from "@/lib/upload-files";

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

  const safeLogs = await Promise.all(
    logs.map(async (log) => ({
      ...log,
      photoUrl: (await uploadUrlExists(log.photoUrl)) ? log.photoUrl : null,
    }))
  );

  return NextResponse.json({ logs: safeLogs });
}

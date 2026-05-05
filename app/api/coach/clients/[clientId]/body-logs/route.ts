import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import { checkFeatureAccess, tierAccessDenied } from "@/lib/feature-access";

async function ensureCoachOwnsClient(coachId: string, clientId: string) {
  const relation = await prisma.coachClientRelation.findFirst({
    where: { coachId, clientId, status: "ACCEPTED" },
    select: { id: true },
  });
  return Boolean(relation);
}

export async function GET(
  _request: Request,
  context: { params: Promise<{ clientId: string }> }
) {
  const auth = await requireAuth("COACH");
  if (auth.error) return auth.error;

  const access = await checkFeatureAccess(auth.session.user.id, "bodyTracking");
  if (!access.allowed) return tierAccessDenied(access.reason, access.tier);

  const { clientId } = await context.params;

  if (!(await ensureCoachOwnsClient(auth.session.user.id, clientId))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const logs = await prisma.bodyMetricLog.findMany({
    where: { clientId },
    orderBy: { date: "desc" },
    select: {
      id: true,
      date: true,
      weight: true,
      shoulder: true,
      chest: true,
      waist: true,
      hips: true,
      arm: true,
      leg: true,
      frontPhotoUrl: true,
      sidePhotoUrl: true,
      backPhotoUrl: true,
      createdAt: true,
    },
  });

  return NextResponse.json({ logs });
}

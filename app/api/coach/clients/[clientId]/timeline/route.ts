import { NextResponse } from "next/server";

import { requireAuth } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import { getClientTimeline } from "@/lib/coach-timeline";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ clientId: string }> }
) {
  const auth = await requireAuth("COACH");
  if (auth.error) return auth.error;

  const { clientId } = await params;
  const { searchParams } = new URL(request.url);
  const page = Math.max(1, Number(searchParams.get("page") ?? "1"));
  const pageSize = Math.min(50, Math.max(1, Number(searchParams.get("pageSize") ?? "10")));

  // Verify coach–client relation
  const relation = await prisma.coachClientRelation.findFirst({
    where: { coachId: auth.session.user.id, clientId, status: "ACCEPTED" },
  });
  if (!relation) {
    return NextResponse.json({ error: "Bu danışanla bağlantınız yok." }, { status: 403 });
  }

  const result = await getClientTimeline(clientId, page, pageSize);

  return NextResponse.json({ ...result, page });
}

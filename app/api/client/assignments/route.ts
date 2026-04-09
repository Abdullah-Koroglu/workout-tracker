import { NextResponse } from "next/server";

import { requireAuth } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const auth = await requireAuth("CLIENT");
  if (auth.error) return auth.error;

  const assignments = await prisma.templateAssignment.findMany({
    where: { clientId: auth.session.user.id },
    include: { template: { include: { coach: true } } },
    orderBy: { createdAt: "desc" }
  });

  return NextResponse.json({ assignments });
}

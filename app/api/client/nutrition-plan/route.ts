import { NextResponse } from "next/server";

import { requireAuth } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const auth = await requireAuth("CLIENT");
  if (auth.error) return auth.error;

  const plan = await prisma.nutritionPlan.findUnique({
    where: { clientId: auth.session.user.id },
    select: {
      id: true,
      targetCalories: true,
      targetProtein: true,
      targetCarbs: true,
      targetFats: true,
      dietDocumentUrl: true,
      instructions: true,
      updatedAt: true,
    },
  });

  return NextResponse.json({ plan });
}

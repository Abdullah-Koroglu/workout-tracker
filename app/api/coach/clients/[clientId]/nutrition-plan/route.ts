import { NextResponse } from "next/server";

import { requireAuth } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import { nutritionPlanSchema } from "@/validations/nutrition";

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

  const { clientId } = await context.params;

  if (!(await ensureCoachOwnsClient(auth.session.user.id, clientId))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const plan = await prisma.nutritionPlan.findUnique({
    where: { clientId },
  });

  return NextResponse.json({ plan });
}

async function upsert(
  request: Request,
  context: { params: Promise<{ clientId: string }> }
) {
  const auth = await requireAuth("COACH");
  if (auth.error) return auth.error;

  const { clientId } = await context.params;

  if (!(await ensureCoachOwnsClient(auth.session.user.id, clientId))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json().catch(() => ({}));
  const parsed = nutritionPlanSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const data = parsed.data;
  const plan = await prisma.nutritionPlan.upsert({
    where: { clientId },
    create: {
      clientId,
      coachId: auth.session.user.id,
      targetCalories: data.targetCalories ?? null,
      targetProtein: data.targetProtein ?? null,
      targetCarbs: data.targetCarbs ?? null,
      targetFats: data.targetFats ?? null,
      dietDocumentUrl: data.dietDocumentUrl ?? null,
      instructions: data.instructions ?? null,
    },
    update: {
      coachId: auth.session.user.id,
      targetCalories: data.targetCalories ?? null,
      targetProtein: data.targetProtein ?? null,
      targetCarbs: data.targetCarbs ?? null,
      targetFats: data.targetFats ?? null,
      dietDocumentUrl: data.dietDocumentUrl ?? null,
      instructions: data.instructions ?? null,
    },
  });

  return NextResponse.json({ plan });
}

export const POST = upsert;
export const PUT = upsert;

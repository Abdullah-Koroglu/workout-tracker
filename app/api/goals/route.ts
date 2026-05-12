import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAuth } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";

const createSchema = z.object({
  clientId: z.string().optional(),
  title: z.string().min(2).max(120),
  type: z.string().min(1).max(40),
  targetValue: z.number().nullable().optional(),
  currentValue: z.number().nullable().optional(),
  unit: z.string().max(20).nullable().optional(),
  targetDate: z.string().datetime().nullable().optional(),
});

export async function GET(request: Request) {
  const auth = await requireAuth();
  if ("error" in auth) return auth.error;

  const url = new URL(request.url);
  const clientIdFilter = url.searchParams.get("clientId");
  const userId = auth.session.user.id;
  const role = auth.session.user.role;

  const where =
    role === "COACH"
      ? clientIdFilter
        ? { clientId: clientIdFilter, coachId: userId }
        : { coachId: userId }
      : { clientId: userId };

  const goals = await prisma.goal.findMany({
    where,
    orderBy: [{ status: "asc" }, { createdAt: "desc" }],
    include: { milestones: { orderBy: { order: "asc" } } },
  });

  return NextResponse.json({ goals });
}

export async function POST(request: Request) {
  const auth = await requireAuth();
  if ("error" in auth) return auth.error;

  const body = await request.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const data = parsed.data;
  const userId = auth.session.user.id;
  const role = auth.session.user.role;

  let clientId: string;
  let coachId: string | null = null;

  if (role === "COACH") {
    if (!data.clientId) {
      return NextResponse.json({ error: "clientId required" }, { status: 400 });
    }
    const relation = await prisma.coachClientRelation.findFirst({
      where: { coachId: userId, clientId: data.clientId, status: "ACCEPTED" },
    });
    if (!relation) {
      return NextResponse.json({ error: "Relation not found" }, { status: 403 });
    }
    clientId = data.clientId;
    coachId = userId;
  } else {
    clientId = userId;
    const relation = await prisma.coachClientRelation.findFirst({
      where: { clientId: userId, status: "ACCEPTED" },
      select: { coachId: true },
    });
    coachId = relation?.coachId ?? null;
  }

  const goal = await prisma.goal.create({
    data: {
      clientId,
      coachId,
      title: data.title,
      type: data.type,
      targetValue: data.targetValue ?? null,
      currentValue: data.currentValue ?? null,
      unit: data.unit ?? null,
      targetDate: data.targetDate ? new Date(data.targetDate) : null,
    },
  });

  return NextResponse.json({ goal });
}

import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAuth } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";

const patchSchema = z.object({
  title: z.string().min(2).max(120).optional(),
  type: z.string().min(1).max(40).optional(),
  targetValue: z.number().nullable().optional(),
  currentValue: z.number().nullable().optional(),
  unit: z.string().max(20).nullable().optional(),
  targetDate: z.string().datetime().nullable().optional(),
  status: z.enum(["active", "achieved", "abandoned"]).optional(),
  milestones: z
    .array(
      z.object({
        id: z.string().optional(),
        title: z.string().min(1).max(120),
        achievedAt: z.string().datetime().nullable().optional(),
        order: z.number().int().min(0).default(0),
      }),
    )
    .max(20)
    .optional(),
});

async function loadGoal(id: string, userId: string, role: string) {
  const goal = await prisma.goal.findUnique({ where: { id } });
  if (!goal) return null;
  if (role === "COACH" && goal.coachId !== userId) return null;
  if (role === "CLIENT" && goal.clientId !== userId) return null;
  return goal;
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireAuth();
  if ("error" in auth) return auth.error;
  const { id } = await params;
  const userId = auth.session.user.id;
  const role = auth.session.user.role;

  const goal = await loadGoal(id, userId, role);
  if (!goal) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await request.json();
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const data = parsed.data;

  const updated = await prisma.goal.update({
    where: { id },
    data: {
      ...(data.title !== undefined ? { title: data.title } : {}),
      ...(data.type !== undefined ? { type: data.type } : {}),
      ...(data.targetValue !== undefined ? { targetValue: data.targetValue } : {}),
      ...(data.currentValue !== undefined ? { currentValue: data.currentValue } : {}),
      ...(data.unit !== undefined ? { unit: data.unit } : {}),
      ...(data.targetDate !== undefined
        ? { targetDate: data.targetDate ? new Date(data.targetDate) : null }
        : {}),
      ...(data.status !== undefined ? { status: data.status } : {}),
    },
  });

  if (data.milestones) {
    await prisma.milestone.deleteMany({ where: { goalId: id } });
    if (data.milestones.length > 0) {
      await prisma.milestone.createMany({
        data: data.milestones.map((m, i) => ({
          goalId: id,
          title: m.title,
          achievedAt: m.achievedAt ? new Date(m.achievedAt) : null,
          order: m.order ?? i,
        })),
      });
    }
  }

  const goalWithMilestones = await prisma.goal.findUnique({
    where: { id },
    include: { milestones: { orderBy: { order: "asc" } } },
  });

  return NextResponse.json({ goal: goalWithMilestones ?? updated });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireAuth();
  if ("error" in auth) return auth.error;
  const { id } = await params;
  const goal = await loadGoal(id, auth.session.user.id, auth.session.user.role);
  if (!goal) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.goal.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}

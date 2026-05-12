import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const auth = await requireAuth();
  if ("error" in auth) return auth.error;

  const url = new URL(request.url);
  const requestedClient = url.searchParams.get("clientId");
  let clientId = auth.session.user.id;

  if (auth.session.user.role === "COACH") {
    if (!requestedClient) return NextResponse.json({ error: "clientId required" }, { status: 400 });
    const relation = await prisma.coachClientRelation.findFirst({
      where: { coachId: auth.session.user.id, clientId: requestedClient },
    });
    if (!relation) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    clientId = requestedClient;
  }

  const prs = await prisma.personalRecord.findMany({
    where: { clientId },
    orderBy: { achievedAt: "desc" },
  });

  const exerciseIds = Array.from(new Set(prs.map((p) => p.exerciseId)));
  const exercises = await prisma.exercise.findMany({
    where: { id: { in: exerciseIds } },
    select: { id: true, name: true, targetMuscle: true },
  });
  const map = new Map(exercises.map((e) => [e.id, e]));

  return NextResponse.json({
    records: prs.map((p) => ({
      ...p,
      exercise: map.get(p.exerciseId) ?? null,
    })),
  });
}

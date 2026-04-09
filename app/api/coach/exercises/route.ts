import { NextResponse } from "next/server";

import { requireAuth } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import { exerciseSchema } from "@/validations/exercise";

export async function GET() {
  const auth = await requireAuth("COACH");
  if (auth.error) return auth.error;

  const exercises = await prisma.exercise.findMany({ orderBy: [{ type: "asc" }, { name: "asc" }] });
  return NextResponse.json({ exercises });
}

export async function POST(request: Request) {
  const auth = await requireAuth("COACH");
  if (auth.error) return auth.error;

  const body = await request.json();
  const parsed = exerciseSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const exercise = await prisma.exercise.create({ data: parsed.data });
  return NextResponse.json({ exercise }, { status: 201 });
}

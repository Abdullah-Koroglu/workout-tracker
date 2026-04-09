import { NextResponse } from "next/server";
import { z } from "zod";

import { requireAuth } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";

const schema = z.object({
  coachId: z.string().min(1)
});

export async function POST(request: Request) {
  const auth = await requireAuth("CLIENT");
  if (auth.error) return auth.error;

  const body = await request.json();
  const parsed = schema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const relation = await prisma.coachClientRelation.upsert({
    where: {
      coachId_clientId: {
        coachId: parsed.data.coachId,
        clientId: auth.session.user.id
      }
    },
    update: { status: "PENDING" },
    create: {
      coachId: parsed.data.coachId,
      clientId: auth.session.user.id,
      status: "PENDING"
    }
  });

  return NextResponse.json({ relation }, { status: 201 });
}

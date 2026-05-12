import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAuth } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";

const createSchema = z.object({
  coachId: z.string().min(1),
  packageId: z.string().optional(),
  expiresAt: z.string().datetime().optional(),
});

export async function GET(request: Request) {
  const auth = await requireAuth();
  if ("error" in auth) return auth.error;

  const url = new URL(request.url);
  const status = url.searchParams.get("status") ?? undefined;
  const userId = auth.session.user.id;
  const role = auth.session.user.role;

  const where = role === "COACH"
    ? { coachId: userId, ...(status ? { status } : {}) }
    : { clientId: userId, ...(status ? { status } : {}) };

  const subs = await prisma.subscription.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: {
      package: true,
      coach: { select: { id: true, name: true } },
      client: { select: { id: true, name: true } },
      payments: { orderBy: { createdAt: "desc" }, take: 5 },
    },
  });

  return NextResponse.json({ subscriptions: subs });
}

export async function POST(request: Request) {
  const auth = await requireAuth("CLIENT");
  if ("error" in auth) return auth.error;
  const body = await request.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const sub = await prisma.subscription.create({
    data: {
      clientId: auth.session.user.id,
      coachId: parsed.data.coachId,
      packageId: parsed.data.packageId ?? null,
      status: "active",
      expiresAt: parsed.data.expiresAt ? new Date(parsed.data.expiresAt) : null,
    },
  });

  return NextResponse.json({ subscription: sub });
}

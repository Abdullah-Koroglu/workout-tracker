import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";

import { requireAuth } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";

type PushSubscriptionBody = {
  subscription?: unknown;
};

export async function POST(request: Request) {
  const auth = await requireAuth();
  if (auth.error) return auth.error;

  const body = (await request.json().catch(() => ({}))) as PushSubscriptionBody;
  if (!body.subscription) {
    return NextResponse.json({ error: "Subscription is required" }, { status: 400 });
  }

  await prisma.user.update({
    where: { id: auth.session.user.id },
    data: { pushSubscription: body.subscription }
  });

  return NextResponse.json({ success: true });
}

export async function DELETE() {
  const auth = await requireAuth();
  if (auth.error) return auth.error;

  await prisma.user.update({
    where: { id: auth.session.user.id },
    data: { pushSubscription: Prisma.DbNull }
  });

  return NextResponse.json({ success: true });
}

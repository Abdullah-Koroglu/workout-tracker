import { NextResponse } from "next/server";

import { requireAuth } from "@/lib/api-auth";
import { expireStaleInvite } from "@/lib/call-invite";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const auth = await requireAuth();
  if ("error" in auth) return auth.error;

  const userId = auth.session.user.id;
  const calls = await prisma.callInvite.findMany({
    where: {
      calleeId: userId,
      status: "RINGING",
    },
    include: {
      caller: { select: { id: true, name: true, role: true } },
      callee: { select: { id: true, name: true, role: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 3,
  });

  for (const call of calls) {
    await expireStaleInvite(call.id);
  }

  const freshCalls = calls.filter((call) => call.expiresAt.getTime() > Date.now());
  return NextResponse.json({ calls: freshCalls });
}

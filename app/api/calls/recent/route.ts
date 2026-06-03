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
      OR: [{ callerId: userId }, { calleeId: userId }],
    },
    include: {
      caller: { select: { id: true, name: true, role: true } },
      callee: { select: { id: true, name: true, role: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 8,
  });

  for (const call of calls) {
    await expireStaleInvite(call.id);
  }

  const refreshedCalls = await prisma.callInvite.findMany({
    where: {
      OR: [{ callerId: userId }, { calleeId: userId }],
    },
    include: {
      caller: { select: { id: true, name: true, role: true } },
      callee: { select: { id: true, name: true, role: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 8,
  });

  return NextResponse.json({
    calls: refreshedCalls.map((call) => {
      const isCaller = call.callerId === userId;
      const peer = isCaller ? call.callee : call.caller;
      return {
        id: call.id,
        type: call.type,
        status: call.status,
        createdAt: call.createdAt,
        actionUrl: `/calls/${call.id}`,
        peer,
        direction: isCaller ? "OUTGOING" : "INCOMING",
      };
    }),
  });
}

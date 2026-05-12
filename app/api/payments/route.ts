import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const auth = await requireAuth();
  if ("error" in auth) return auth.error;
  const url = new URL(request.url);
  const userId = auth.session.user.id;
  const role = auth.session.user.role;
  const subscriptionIdFilter = url.searchParams.get("subscriptionId");

  const subWhere = role === "COACH" ? { coachId: userId } : { clientId: userId };

  const payments = await prisma.payment.findMany({
    where: {
      ...(subscriptionIdFilter ? { subscriptionId: subscriptionIdFilter } : {}),
      subscription: subWhere,
    },
    orderBy: { createdAt: "desc" },
    include: {
      subscription: {
        include: {
          coach: { select: { id: true, name: true } },
          client: { select: { id: true, name: true } },
        },
      },
    },
  });

  const summary =
    role === "COACH"
      ? {
          totalRevenue: payments
            .filter((p) => p.status === "succeeded")
            .reduce((s, p) => s + p.amount, 0),
          paymentCount: payments.filter((p) => p.status === "succeeded").length,
        }
      : null;

  return NextResponse.json({ payments, summary });
}

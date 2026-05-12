import { NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { requireAuth } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const auth = await requireAuth();
  if ("error" in auth) return auth.error;
  const referrals = await prisma.referral.findMany({
    where: { referrerId: auth.session.user.id },
    orderBy: { createdAt: "desc" },
    include: { referee: { select: { id: true, name: true } } },
  });
  return NextResponse.json({ referrals });
}

export async function POST() {
  const auth = await requireAuth();
  if ("error" in auth) return auth.error;
  const code = randomBytes(5).toString("hex").toUpperCase();
  const referral = await prisma.referral.create({
    data: {
      referrerId: auth.session.user.id,
      code,
      status: "pending",
    },
  });
  return NextResponse.json({ referral });
}

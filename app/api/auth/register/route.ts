import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";

import { isPrismaUniqueError } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { registerSchema } from "@/validations/user";
import { canAcceptNewClient } from "@/lib/config/pricing";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = registerSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const inviteCode: string | undefined =
      typeof body.inviteCode === "string" && body.inviteCode.trim()
        ? body.inviteCode.trim()
        : undefined;

    // Legacy support: coachId directly (from /invite/[coachId] page)
    const coachId: string | undefined =
      typeof body.coachId === "string" && body.coachId.trim()
        ? body.coachId.trim()
        : undefined;

    if ((inviteCode || coachId) && parsed.data.role !== "CLIENT") {
      return NextResponse.json(
        { error: "Davet linkleri yalnızca danışan kaydı içindir." },
        { status: 400 }
      );
    }

    let resolvedCoachId: string | null = null;
    let coachTier: import("@prisma/client").SubscriptionTier | null = null;

    if (inviteCode) {
      const coachProfile = await prisma.coachProfile.findUnique({
        where: { inviteCode },
        select: { userId: true, subscriptionTier: true },
      });
      if (!coachProfile) {
        return NextResponse.json({ error: "Geçersiz davet kodu." }, { status: 400 });
      }
      resolvedCoachId = coachProfile.userId;
      coachTier = coachProfile.subscriptionTier;
    } else if (coachId) {
      const coach = await prisma.user.findUnique({ where: { id: coachId, role: "COACH" } });
      if (!coach) {
        return NextResponse.json({ error: "Geçersiz davet linki." }, { status: 400 });
      }
      const profile = await prisma.coachProfile.findUnique({
        where: { userId: coachId },
        select: { subscriptionTier: true },
      });
      resolvedCoachId = coachId;
      coachTier = profile?.subscriptionTier ?? "FREE";
    }

    const normalizedEmail = parsed.data.email.trim().toLowerCase();
    const hashedPassword = await bcrypt.hash(parsed.data.password, 10);

    const user = await prisma.user.create({
      data: {
        name: parsed.data.name,
        email: normalizedEmail,
        password: hashedPassword,
        role: parsed.data.role,
      },
    });

    if (resolvedCoachId && coachTier) {
      const acceptedCount = await prisma.coachClientRelation.count({
        where: { coachId: resolvedCoachId, status: "ACCEPTED" },
      });
      const autoAccept = canAcceptNewClient(acceptedCount, coachTier);
      await prisma.coachClientRelation.create({
        data: {
          coachId: resolvedCoachId,
          clientId: user.id,
          status: autoAccept ? "ACCEPTED" : "PENDING",
        },
      });
    }

    return NextResponse.json({ id: user.id }, { status: 201 });
  } catch (error) {
    if (isPrismaUniqueError(error)) {
      return NextResponse.json({ error: "Bu e-posta zaten kayıtlı." }, { status: 409 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

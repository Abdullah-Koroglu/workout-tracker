import { NextResponse } from "next/server";

import { requireAuth } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const auth = await requireAuth();
  if ('error' in auth) return auth.error;

  const userId = auth.session.user.id;
  const role = auth.session.user.role;

  if (role === "COACH") {
    const profile = await prisma.coachProfile.findUnique({
      where: { userId },
      include: { packages: { where: { isActive: true }, orderBy: { createdAt: "asc" } } },
    });
    return NextResponse.json({ profile });
  }

  const profile = await prisma.clientProfile.findUnique({ where: { userId } });
  return NextResponse.json({ profile });
}

export async function PUT(request: Request) {
  const auth = await requireAuth();
  if ('error' in auth) return auth.error;

  const userId = auth.session.user.id;
  const role = auth.session.user.role;
  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Geçersiz istek." }, { status: 400 });
  }

  if (role === "COACH") {
    const { bio, specialties, experienceYears, socialMediaUrl } = body as Record<string, unknown>;

    const profile = await prisma.coachProfile.upsert({
      where: { userId },
      create: {
        userId,
        bio: typeof bio === "string" ? bio.trim() || null : null,
        specialties: Array.isArray(specialties) ? specialties : undefined,
        experienceYears: typeof experienceYears === "number" ? experienceYears : null,
        socialMediaUrl: typeof socialMediaUrl === "string" ? socialMediaUrl.trim() || null : null,
      },
      update: {
        bio: typeof bio === "string" ? bio.trim() || null : null,
        specialties: Array.isArray(specialties) ? specialties : undefined,
        experienceYears: typeof experienceYears === "number" ? experienceYears : null,
        socialMediaUrl: typeof socialMediaUrl === "string" ? socialMediaUrl.trim() || null : null,
      },
    });
    return NextResponse.json({ profile });
  }

  // CLIENT
  const { birthDate, heightCm, weightKg, goal, fitnessLevel } = body as Record<string, unknown>;

  const profile = await prisma.clientProfile.upsert({
    where: { userId },
    create: {
      userId,
      birthDate: typeof birthDate === "string" && birthDate ? new Date(birthDate) : null,
      heightCm: typeof heightCm === "number" ? heightCm : null,
      weightKg: typeof weightKg === "number" ? weightKg : null,
      goal: typeof goal === "string" ? goal || null : null,
      fitnessLevel: typeof fitnessLevel === "string" ? fitnessLevel || null : null,
    },
    update: {
      birthDate: typeof birthDate === "string" && birthDate ? new Date(birthDate) : null,
      heightCm: typeof heightCm === "number" ? heightCm : null,
      weightKg: typeof weightKg === "number" ? weightKg : null,
      goal: typeof goal === "string" ? goal || null : null,
      fitnessLevel: typeof fitnessLevel === "string" ? fitnessLevel || null : null,
    },
  });
  return NextResponse.json({ profile });
}

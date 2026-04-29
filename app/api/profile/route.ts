import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";

import { requireAuth } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";

async function getCoachAvatarUrl(userId: string): Promise<string | null> {
  const dir = path.join(process.cwd(), "public", "uploads", "avatars");

  try {
    const entries = await fs.readdir(dir);
    const fileName = entries.find((name) => name.startsWith(`${userId}.`));
    if (!fileName) return null;
    return `/uploads/avatars/${fileName}`;
  } catch {
    return null;
  }
}

export async function GET() {
  const auth = await requireAuth();
  if ('error' in auth) return auth.error;

  const userId = auth.session.user.id;
  const role = auth.session.user.role;

  if (role === "COACH") {
    const [user, profile, avatarUrl] = await Promise.all([
      prisma.user.findUnique({ where: { id: userId }, select: { name: true } }),
      prisma.coachProfile.findUnique({
        where: { userId },
        include: { packages: { where: { isActive: true }, orderBy: { createdAt: "asc" } } },
      }),
      getCoachAvatarUrl(userId),
    ]);
    return NextResponse.json({ profile: { ...profile, name: user?.name, avatarUrl } });
  }

  const [user, profile] = await Promise.all([
    prisma.user.findUnique({ where: { id: userId }, select: { name: true } }),
    prisma.clientProfile.findUnique({ where: { userId } }),
  ]);
  return NextResponse.json({ profile: { ...profile, name: user?.name } });
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

  const { name } = body as Record<string, unknown>;

  // Update User.name if provided
  if (typeof name === "string" && name.trim()) {
    await prisma.user.update({
      where: { id: userId },
      data: { name: name.trim() },
    });
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

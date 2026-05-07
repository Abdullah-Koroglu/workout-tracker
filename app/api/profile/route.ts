import { NextResponse } from "next/server";
import { randomBytes } from "crypto";

import { requireAuth } from "@/lib/api-auth";
import { isPrismaUniqueError } from "@/lib/auth";
import { getCoachAvatarUrl } from "@/lib/coach-avatar";
import { prisma } from "@/lib/prisma";
import { clientProfileSchema, coachProfileSchema } from "@/validations/profile";

function normalizeName(name?: string) {
  return name?.trim() || undefined;
}

function normalizeEmail(email?: string) {
  return email?.trim().toLowerCase() || undefined;
}

function toNullableDate(value?: string | null) {
  return value ? new Date(value) : null;
}

export async function GET() {
  try {
    const auth = await requireAuth();
    if ("error" in auth) return auth.error;

    const userId = auth.session.user.id;
    const role = auth.session.user.role;

    if (role === "COACH") {
      const [user, profile, avatarUrl] = await Promise.all([
        prisma.user.findUnique({
          where: { id: userId },
          select: { name: true, email: true },
        }),
        prisma.coachProfile.findUnique({
          where: { userId },
          include: { packages: { where: { isActive: true }, orderBy: { createdAt: "asc" } } },
        }),
        getCoachAvatarUrl(userId),
      ]);

      return NextResponse.json({
        profile: { ...profile, name: user?.name, email: user?.email, avatarUrl },
      });
    }

    const [user, profile] = await Promise.all([
      prisma.user.findUnique({
        where: { id: userId },
        select: { name: true, email: true },
      }),
      prisma.clientProfile.findUnique({ where: { userId } }),
    ]);

    return NextResponse.json({ profile: { ...profile, name: user?.name, email: user?.email } });
  } catch (error) {
    console.error("[api/profile] Failed to load profile", error);
    return NextResponse.json({ error: "Profil yüklenemedi." }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const auth = await requireAuth();
    if ("error" in auth) return auth.error;

    const userId = auth.session.user.id;
    const role = auth.session.user.role;
    const body = await request.json().catch(() => null);

    if (!body || typeof body !== "object") {
      return NextResponse.json({ error: "Geçersiz istek." }, { status: 400 });
    }

    if (role === "COACH") {
      const parsed = coachProfileSchema.safeParse(body);
      if (!parsed.success) {
        return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
      }

      const data = parsed.data;

      if (data.name || data.email) {
        await prisma.user.update({
          where: { id: userId },
          data: {
            ...(data.name ? { name: normalizeName(data.name) } : {}),
            ...(data.email ? { email: normalizeEmail(data.email) } : {}),
          },
        });
      }

      const profile = await prisma.coachProfile.upsert({
        where: { userId },
        create: {
          userId,
          inviteCode: randomBytes(10).toString("hex"),
          bio: data.bio ?? null,
          slogan: data.slogan ?? null,
          accentColor: data.accentColor ?? "#F97316",
          transformationPhotos: data.transformationPhotos ?? null,
          specialties: data.specialties ?? undefined,
          experienceYears: data.experienceYears ?? null,
          socialMediaUrl: data.socialMediaUrl ?? null,
        },
        update: {
          bio: data.bio ?? null,
          slogan: data.slogan ?? null,
          accentColor: data.accentColor ?? "#F97316",
          transformationPhotos: data.transformationPhotos ?? null,
          specialties: data.specialties ?? undefined,
          experienceYears: data.experienceYears ?? null,
          socialMediaUrl: data.socialMediaUrl ?? null,
        },
      });

      return NextResponse.json({ profile });
    }

    const parsed = clientProfileSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const data = parsed.data;

    if (data.name || data.email) {
      await prisma.user.update({
        where: { id: userId },
        data: {
          ...(data.name ? { name: normalizeName(data.name) } : {}),
          ...(data.email ? { email: normalizeEmail(data.email) } : {}),
        },
      });
    }

    const profile = await prisma.clientProfile.upsert({
      where: { userId },
      create: {
        userId,
          age: data.age ?? null,
          gender: data.gender ?? null,
        birthDate: toNullableDate(data.birthDate),
        heightCm: data.heightCm ?? null,
        weightKg: data.weightKg ?? null,
        goal: data.goal ?? null,
        fitnessLevel: data.fitnessLevel ?? null,
      },
      update: {
          age: data.age ?? null,
          gender: data.gender ?? null,
        birthDate: toNullableDate(data.birthDate),
        heightCm: data.heightCm ?? null,
        weightKg: data.weightKg ?? null,
        goal: data.goal ?? null,
        fitnessLevel: data.fitnessLevel ?? null,
      },
    });

    return NextResponse.json({ profile });
  } catch (error) {
    console.error("[api/profile] Failed to update profile", error);

    if (isPrismaUniqueError(error)) {
      return NextResponse.json({ error: "Bu e-posta zaten kayıtlı." }, { status: 409 });
    }

    return NextResponse.json({ error: "Profil güncellenemedi." }, { status: 500 });
  }
}

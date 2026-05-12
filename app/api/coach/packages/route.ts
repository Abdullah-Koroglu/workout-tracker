import { NextResponse } from "next/server";

import { requireAuth } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";

// GET  /api/coach/packages  — coach's own packages (all)
export async function GET() {
  const auth = await requireAuth("COACH");
  if ('error' in auth) return auth.error;

  const profile = await prisma.coachProfile.findUnique({
    where: { userId: auth.session.user.id },
    select: { id: true, packages: { orderBy: { createdAt: "asc" } } },
  });

  return NextResponse.json({ packages: profile?.packages ?? [] });
}

// POST /api/coach/packages  — create a new package
export async function POST(request: Request) {
  const auth = await requireAuth("COACH");
  if ('error' in auth) return auth.error;

  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Geçersiz istek." }, { status: 400 });
  }

  const {
    title,
    description,
    price,
    durationWeeks,
    sessionsIncluded,
    maxClients,
    discount,
    originalPrice,
    recurringInterval,
    features,
  } = body as Record<string, unknown>;
  if (!title || typeof title !== "string" || !title.trim()) {
    return NextResponse.json({ error: "Başlık zorunludur." }, { status: 400 });
  }

  // Ensure profile exists
  const profile = await prisma.coachProfile.upsert({
    where: { userId: auth.session.user.id },
    create: { userId: auth.session.user.id },
    update: {},
    select: { id: true },
  });

  const pkg = await prisma.coachPackage.create({
    data: {
      profileId: profile.id,
      title: title.trim(),
      description: typeof description === "string" ? description.trim() || null : null,
      price: typeof price === "number" && price > 0 ? price : null,
      durationWeeks: typeof durationWeeks === "number" && durationWeeks > 0 ? durationWeeks : null,
      sessionsIncluded: typeof sessionsIncluded === "number" && sessionsIncluded > 0 ? sessionsIncluded : null,
      maxClients: typeof maxClients === "number" && maxClients > 0 ? maxClients : null,
      discount: typeof discount === "number" && discount > 0 ? discount : null,
      originalPrice: typeof originalPrice === "number" && originalPrice > 0 ? originalPrice : null,
      recurringInterval: typeof recurringInterval === "string" ? recurringInterval : null,
      features: Array.isArray(features) ? JSON.stringify(features) : "[]",
    },
  });

  return NextResponse.json({ package: pkg }, { status: 201 });
}

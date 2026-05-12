import { NextResponse } from "next/server";

import { requireAuth } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";

// PATCH /api/coach/packages/[packageId]
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ packageId: string }> }
) {
  const auth = await requireAuth("COACH");
  if ('error' in auth) return auth.error;

  const { packageId } = await params;
  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Geçersiz istek." }, { status: 400 });
  }

  // Verify ownership
  const existing = await prisma.coachPackage.findUnique({
    where: { id: packageId },
    include: { profile: { select: { userId: true } } },
  });
  if (!existing || existing.profile.userId !== auth.session.user.id) {
    return NextResponse.json({ error: "Bulunamadı." }, { status: 404 });
  }

  const {
    title,
    description,
    price,
    isActive,
    isPopular,
    features,
    durationWeeks,
    sessionsIncluded,
    maxClients,
    sortOrder,
    discount,
    originalPrice,
    recurringInterval,
  } = body as Record<string, unknown>;
  const pkg = await prisma.coachPackage.update({
    where: { id: packageId },
    data: {
      ...(typeof title === "string" && title.trim() ? { title: title.trim() } : {}),
      ...(typeof description === "string" ? { description: description.trim() || null } : {}),
      ...(price !== undefined ? { price: typeof price === "number" && price > 0 ? price : null } : {}),
      ...(typeof isActive === "boolean" ? { isActive } : {}),
      ...(typeof isPopular === "boolean" ? { isPopular } : {}),
      ...(Array.isArray(features) ? { features: JSON.stringify(features) } : {}),
      ...(durationWeeks !== undefined
        ? { durationWeeks: typeof durationWeeks === "number" && durationWeeks > 0 ? durationWeeks : null }
        : {}),
      ...(sessionsIncluded !== undefined
        ? { sessionsIncluded: typeof sessionsIncluded === "number" && sessionsIncluded > 0 ? sessionsIncluded : null }
        : {}),
      ...(maxClients !== undefined
        ? { maxClients: typeof maxClients === "number" && maxClients > 0 ? maxClients : null }
        : {}),
      ...(typeof sortOrder === "number" ? { sortOrder } : {}),
      ...(discount !== undefined
        ? { discount: typeof discount === "number" && discount > 0 ? discount : null }
        : {}),
      ...(originalPrice !== undefined
        ? { originalPrice: typeof originalPrice === "number" && originalPrice > 0 ? originalPrice : null }
        : {}),
      ...(recurringInterval !== undefined
        ? { recurringInterval: typeof recurringInterval === "string" ? recurringInterval : null }
        : {}),
    },
  });

  return NextResponse.json({ package: pkg });
}

// DELETE /api/coach/packages/[packageId]
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ packageId: string }> }
) {
  const auth = await requireAuth("COACH");
  if ('error' in auth) return auth.error;

  const { packageId } = await params;

  const existing = await prisma.coachPackage.findUnique({
    where: { id: packageId },
    include: { profile: { select: { userId: true } } },
  });
  if (!existing || existing.profile.userId !== auth.session.user.id) {
    return NextResponse.json({ error: "Bulunamadı." }, { status: 404 });
  }

  await prisma.coachPackage.delete({ where: { id: packageId } });
  return NextResponse.json({ ok: true });
}

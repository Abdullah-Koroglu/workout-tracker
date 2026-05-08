import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import { nanoid } from "nanoid";

import { requireAuth } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";

const MAX_SIZE_BYTES = 4 * 1024 * 1024;
const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

function extensionFromMime(mime: string): string {
  if (mime === "image/jpeg") return "jpg";
  if (mime === "image/png") return "png";
  if (mime === "image/webp") return "webp";
  return "bin";
}

export async function POST(request: Request) {
  const auth = await requireAuth("COACH");
  if (auth.error) return auth.error;

  const formData = await request.formData().catch(() => null);
  const beforeFile = formData?.get("beforeImage");
  const afterFile = formData?.get("afterImage");
  const title = formData?.get("title")?.toString() || null;

  if (!(beforeFile instanceof File) || !(afterFile instanceof File)) {
    return NextResponse.json({ error: "Önce ve Sonra görselleri gereklidir." }, { status: 400 });
  }

  if (!ALLOWED_TYPES.has(beforeFile.type) || !ALLOWED_TYPES.has(afterFile.type)) {
    return NextResponse.json({ error: "Sadece JPG, PNG veya WEBP yüklenebilir." }, { status: 400 });
  }

  if (beforeFile.size > MAX_SIZE_BYTES || afterFile.size > MAX_SIZE_BYTES) {
    return NextResponse.json({ error: "Her dosya 4MB'den büyük olamaz." }, { status: 400 });
  }

  const userId = auth.session.user.id;
  const uploadsDir = path.join(process.cwd(), "public", "uploads", "transformations");

  try {
    await fs.mkdir(uploadsDir, { recursive: true });
  } catch (error) {
    console.error("[Transformations] Directory creation error:", { userId, uploadsDir, error });
    return NextResponse.json({ error: "Klasör oluşturulamadı." }, { status: 500 });
  }

  const photoId = nanoid(12);
  const beforeExt = extensionFromMime(beforeFile.type);
  const afterExt = extensionFromMime(afterFile.type);
  const beforeFileName = `${userId}-${photoId}-before.${beforeExt}`;
  const afterFileName = `${userId}-${photoId}-after.${afterExt}`;

  try {
    const beforeBuffer = Buffer.from(await beforeFile.arrayBuffer());
    const afterBuffer = Buffer.from(await afterFile.arrayBuffer());

    const beforeDest = path.join(uploadsDir, beforeFileName);
    const afterDest = path.join(uploadsDir, afterFileName);

    await fs.writeFile(beforeDest, beforeBuffer);
    await fs.writeFile(afterDest, afterBuffer);

    const beforeUrl = `/uploads/transformations/${beforeFileName}?v=${Date.now()}`;
    const afterUrl = `/uploads/transformations/${afterFileName}?v=${Date.now()}`;

    const coachProfile = await prisma.coachProfile.findUnique({
      where: { userId },
      select: { transformationPhotos: true },
    });

    const currentPhotos = Array.isArray(coachProfile?.transformationPhotos)
      ? (coachProfile.transformationPhotos as Array<{ id: string; beforeUrl: string; afterUrl: string; title: string | null }>)
      : [];

    const newPhoto = {
      id: photoId,
      beforeUrl,
      afterUrl,
      title: title && title.trim() ? title.trim() : null,
    };

    const updatedPhotos = [...currentPhotos, newPhoto];

    await prisma.coachProfile.update({
      where: { userId },
      data: { transformationPhotos: updatedPhotos },
    });

    console.log("[Transformations] Photo uploaded successfully:", { userId, photoId, size: beforeBuffer.length + afterBuffer.length });

    return NextResponse.json({ transformation: newPhoto });
  } catch (error) {
    console.error("[Transformations] Write error:", { userId, photoId: photoId, error });
    return NextResponse.json({ error: "Dosya kaydedilemedi." }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const auth = await requireAuth("COACH");
  if (auth.error) return auth.error;

  const { searchParams } = new URL(request.url);
  const photoId = searchParams.get("id");

  if (!photoId) {
    return NextResponse.json({ error: "Fotoğraf ID'si gereklidir." }, { status: 400 });
  }

  const userId = auth.session.user.id;

  try {
    const coachProfile = await prisma.coachProfile.findUnique({
      where: { userId },
      select: { transformationPhotos: true },
    });

    const currentPhotos = Array.isArray(coachProfile?.transformationPhotos)
      ? (coachProfile.transformationPhotos as Array<{ id: string; beforeUrl: string; afterUrl: string; title: string | null }>)
      : [];

    const photoToDelete = currentPhotos.find((p) => p.id === photoId);
    if (!photoToDelete) {
      return NextResponse.json({ error: "Fotoğraf bulunamadı." }, { status: 404 });
    }

    const uploadsDir = path.join(process.cwd(), "public", "uploads", "transformations");

    const beforeMatch = photoToDelete.beforeUrl.match(/([a-zA-Z0-9._-]+)(?:\?|$)/);
    const afterMatch = photoToDelete.afterUrl.match(/([a-zA-Z0-9._-]+)(?:\?|$)/);

    if (beforeMatch) {
      try {
        await fs.unlink(path.join(uploadsDir, beforeMatch[1]));
      } catch {
        // Ignore file deletion errors
      }
    }

    if (afterMatch) {
      try {
        await fs.unlink(path.join(uploadsDir, afterMatch[1]));
      } catch {
        // Ignore file deletion errors
      }
    }

    const updatedPhotos = currentPhotos.filter((p) => p.id !== photoId);

    await prisma.coachProfile.update({
      where: { userId },
      data: { transformationPhotos: updatedPhotos },
    });

    console.log("[Transformations] Photo deleted successfully:", { userId, photoId });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[Transformations] Delete error:", { userId, photoId, error });
    return NextResponse.json({ error: "Fotoğraf silinemedi." }, { status: 500 });
  }
}

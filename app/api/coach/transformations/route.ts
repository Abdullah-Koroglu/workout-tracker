import { NextResponse } from "next/server";
import { nanoid } from "nanoid";

import { requireAuth } from "@/lib/api-auth";
import { deleteMediaFile, extractMediaFileName, saveMediaFile } from "@/lib/media-storage";
import { prisma } from "@/lib/prisma";

const MAX_SIZE_BYTES = 4 * 1024 * 1024;
const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

type TransformationPhoto = {
  id: string;
  beforeUrl: string;
  afterUrl: string;
  title: string | null;
};

function extensionFromMime(mime: string): string {
  if (mime === "image/jpeg") return "jpg";
  if (mime === "image/png") return "png";
  if (mime === "image/webp") return "webp";
  return "bin";
}

function readTransformationPhotos(value: unknown): TransformationPhoto[] {
  return Array.isArray(value) ? (value as TransformationPhoto[]) : [];
}

export async function POST(request: Request) {
  const auth = await requireAuth("COACH");
  if (auth.error) return auth.error;

  const formData = await request.formData().catch(() => null);
  const beforeFile = formData?.get("beforeImage");
  const afterFile = formData?.get("afterImage");
  const title = formData?.get("title")?.toString() || null;

  if (!(beforeFile instanceof File) || !(afterFile instanceof File)) {
    return NextResponse.json({ error: "Önce ve sonra görselleri gereklidir." }, { status: 400 });
  }

  if (!ALLOWED_TYPES.has(beforeFile.type) || !ALLOWED_TYPES.has(afterFile.type)) {
    return NextResponse.json({ error: "Sadece JPG, PNG veya WEBP yüklenebilir." }, { status: 400 });
  }

  if (beforeFile.size > MAX_SIZE_BYTES || afterFile.size > MAX_SIZE_BYTES) {
    return NextResponse.json({ error: "Her dosya 4MB'den büyük olamaz." }, { status: 400 });
  }

  const userId = auth.session.user.id;
  const photoId = nanoid(12);
  const beforeFileName = `${userId}-${photoId}-before.${extensionFromMime(beforeFile.type)}`;
  const afterFileName = `${userId}-${photoId}-after.${extensionFromMime(afterFile.type)}`;

  try {
    const [beforeBuffer, afterBuffer] = await Promise.all([
      beforeFile.arrayBuffer().then((buffer) => Buffer.from(buffer)),
      afterFile.arrayBuffer().then((buffer) => Buffer.from(buffer)),
    ]);

    const [beforeSaved, afterSaved] = await Promise.all([
      saveMediaFile({ folder: "transformations", fileName: beforeFileName, buffer: beforeBuffer, cacheBust: true }),
      saveMediaFile({ folder: "transformations", fileName: afterFileName, buffer: afterBuffer, cacheBust: true }),
    ]);

    const coachProfile = await prisma.coachProfile.findUnique({
      where: { userId },
      select: { transformationPhotos: true },
    });

    const currentPhotos = readTransformationPhotos(coachProfile?.transformationPhotos);
    const newPhoto: TransformationPhoto = {
      id: photoId,
      beforeUrl: beforeSaved.url,
      afterUrl: afterSaved.url,
      title: title && title.trim() ? title.trim() : null,
    };

    await prisma.coachProfile.update({
      where: { userId },
      data: { transformationPhotos: [...currentPhotos, newPhoto] },
    });

    console.log("[Transformations] Photo uploaded successfully:", {
      userId,
      photoId,
      size: beforeBuffer.length + afterBuffer.length,
    });

    return NextResponse.json({ transformation: newPhoto });
  } catch (error) {
    console.error("[Transformations] Write error:", { userId, photoId, error });
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

    const currentPhotos = readTransformationPhotos(coachProfile?.transformationPhotos);
    const photoToDelete = currentPhotos.find((photo) => photo.id === photoId);
    if (!photoToDelete) {
      return NextResponse.json({ error: "Fotoğraf bulunamadı." }, { status: 404 });
    }

    await Promise.all(
      [photoToDelete.beforeUrl, photoToDelete.afterUrl].map(async (url) => {
        const fileName = extractMediaFileName(url);
        if (!fileName) return;
        try {
          await deleteMediaFile("transformations", fileName);
        } catch {
          // Ignore media delete errors; DB state remains source of truth.
        }
      }),
    );

    await prisma.coachProfile.update({
      where: { userId },
      data: { transformationPhotos: currentPhotos.filter((photo) => photo.id !== photoId) },
    });

    console.log("[Transformations] Photo deleted successfully:", { userId, photoId });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[Transformations] Delete error:", { userId, photoId, error });
    return NextResponse.json({ error: "Fotoğraf silinemedi." }, { status: 500 });
  }
}

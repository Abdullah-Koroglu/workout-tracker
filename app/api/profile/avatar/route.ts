import { NextResponse } from "next/server";

import { requireAuth } from "@/lib/api-auth";
import { deleteMediaFile, listMediaFiles, saveMediaFile } from "@/lib/media-storage";

const MAX_SIZE_BYTES = 2 * 1024 * 1024;
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
  const file = formData?.get("avatar");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Dosya bulunamadı." }, { status: 400 });
  }

  if (!ALLOWED_TYPES.has(file.type)) {
    return NextResponse.json({ error: "Sadece JPG, PNG veya WEBP yüklenebilir." }, { status: 400 });
  }

  if (file.size > MAX_SIZE_BYTES) {
    return NextResponse.json({ error: "Dosya boyutu 2MB'den büyük olamaz." }, { status: 400 });
  }

  const userId = auth.session.user.id;
  const existing = await listMediaFiles("avatars");
  const staleFiles = existing.filter((name) => name.startsWith(`${userId}.`));
  await Promise.all(
    staleFiles.map(async (name) => {
      try {
        await deleteMediaFile("avatars", name);
      } catch {
        // Ignore stale delete errors.
      }
    }),
  );

  const ext = extensionFromMime(file.type);
  const fileName = `${userId}.${ext}`;

  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    const saved = await saveMediaFile({ folder: "avatars", fileName, buffer, cacheBust: true });
    console.log("[Avatar] File uploaded successfully:", { userId, fileName, size: buffer.length, key: saved.key });
    return NextResponse.json({ avatarUrl: saved.url });
  } catch (error) {
    console.error("[Avatar] Write error:", { userId, fileName, error });
    return NextResponse.json({ error: "Dosya kaydedilemedi." }, { status: 500 });
  }
}

import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";

import { requireAuth } from "@/lib/api-auth";

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
  const uploadsDir = path.join(process.cwd(), "public", "uploads", "avatars");

  try {
    await fs.mkdir(uploadsDir, { recursive: true });
  } catch (error) {
    console.error("[Avatar] Directory creation error:", { userId, uploadsDir, error });
    return NextResponse.json({ error: "Klasör oluşturulamadı." }, { status: 500 });
  }

  const existing = await fs.readdir(uploadsDir).catch(() => [] as string[]);
  const staleFiles = existing.filter((name) => name.startsWith(`${userId}.`));
  await Promise.all(
    staleFiles.map(async (name) => {
      try {
        await fs.unlink(path.join(uploadsDir, name));
      } catch {
        // Ignore stale delete errors.
      }
    })
  );

  const ext = extensionFromMime(file.type);
  const fileName = `${userId}.${ext}`;
  const dest = path.join(uploadsDir, fileName);

  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    await fs.writeFile(dest, buffer);
    console.log("[Avatar] File uploaded successfully:", { userId, fileName, size: buffer.length, path: dest });
  } catch (error) {
    console.error("[Avatar] Write error:", { userId, fileName, dest, error });
    return NextResponse.json({ error: "Dosya kaydedilemedi." }, { status: 500 });
  }

  const avatarUrl = `/uploads/avatars/${fileName}?v=${Date.now()}`;
  return NextResponse.json({ avatarUrl });
}

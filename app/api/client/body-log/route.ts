import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";

import { requireAuth } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";

const MAX_SIZE_BYTES = 10 * 1024 * 1024;
const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/heic", "image/heif"]);

function extensionFromMime(mime: string): string {
  if (mime === "image/jpeg") return "jpg";
  if (mime === "image/png") return "png";
  if (mime === "image/webp") return "webp";
  return "jpg";
}

function todayMidnightUTC(): Date {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
}

async function savePhoto(
  file: File,
  clientId: string,
  slot: string
): Promise<string | null> {
  if (!(file instanceof File) || file.size === 0) return null;
  if (!ALLOWED_TYPES.has(file.type)) return null;
  if (file.size > MAX_SIZE_BYTES) return null;

  const uploadDir = path.join(process.cwd(), "public", "uploads", "checkins");
  await fs.mkdir(uploadDir, { recursive: true });

  const ext = extensionFromMime(file.type);
  const fileName = `${Date.now()}-${clientId}-${slot}.${ext}`;
  const dest = path.join(uploadDir, fileName);
  await fs.writeFile(dest, Buffer.from(await file.arrayBuffer()));
  return `/uploads/checkins/${fileName}`;
}

function parseFloat_(v: FormDataEntryValue | null): number | undefined {
  if (v === null || v === "") return undefined;
  const n = parseFloat(String(v));
  return isNaN(n) ? undefined : n;
}

export async function POST(request: Request) {
  const auth = await requireAuth("CLIENT");
  if (auth.error) return auth.error;

  const contentType = request.headers.get("content-type") || "";
  if (!contentType.includes("multipart/form-data")) {
    return NextResponse.json({ error: "multipart/form-data bekleniyor." }, { status: 400 });
  }

  const formData = await request.formData().catch(() => null);
  if (!formData) {
    return NextResponse.json({ error: "Form verisi okunamadı." }, { status: 400 });
  }

  const clientId = auth.session.user.id;
  // SECURITY: always use server-side today at midnight UTC — ignore any client-sent date
  const date = todayMidnightUTC();

  const weight = parseFloat_(formData.get("weight"));
  const shoulder = parseFloat_(formData.get("shoulder"));
  const chest = parseFloat_(formData.get("chest"));
  const waist = parseFloat_(formData.get("waist"));
  const hips = parseFloat_(formData.get("hips"));
  const arm = parseFloat_(formData.get("arm"));
  const leg = parseFloat_(formData.get("leg"));

  const frontFile = formData.get("frontPhoto");
  const sideFile = formData.get("sidePhoto");
  const backFile = formData.get("backPhoto");

  const [frontPhotoUrl, sidePhotoUrl, backPhotoUrl] = await Promise.all([
    frontFile instanceof File ? savePhoto(frontFile, clientId, "front") : Promise.resolve(null),
    sideFile instanceof File ? savePhoto(sideFile, clientId, "side") : Promise.resolve(null),
    backFile instanceof File ? savePhoto(backFile, clientId, "back") : Promise.resolve(null),
  ]);

  try {
    const log = await prisma.bodyMetricLog.upsert({
      where: { clientId_date: { clientId, date } },
      create: {
        clientId,
        date,
        weight: weight ?? null,
        shoulder: shoulder ?? null,
        chest: chest ?? null,
        waist: waist ?? null,
        hips: hips ?? null,
        arm: arm ?? null,
        leg: leg ?? null,
        frontPhotoUrl: frontPhotoUrl ?? null,
        sidePhotoUrl: sidePhotoUrl ?? null,
        backPhotoUrl: backPhotoUrl ?? null,
      },
      update: {
        ...(weight !== undefined && { weight }),
        ...(shoulder !== undefined && { shoulder }),
        ...(chest !== undefined && { chest }),
        ...(waist !== undefined && { waist }),
        ...(hips !== undefined && { hips }),
        ...(arm !== undefined && { arm }),
        ...(leg !== undefined && { leg }),
        ...(frontPhotoUrl && { frontPhotoUrl }),
        ...(sidePhotoUrl && { sidePhotoUrl }),
        ...(backPhotoUrl && { backPhotoUrl }),
      },
    });

    return NextResponse.json({ log }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Log kaydedilemedi." }, { status: 500 });
  }
}

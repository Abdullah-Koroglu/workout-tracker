import { NextResponse } from "next/server";
import { existsSync, mkdirSync, writeFileSync } from "fs";
import { join } from "path";
import { nanoid } from "nanoid";

import { requireAuth } from "@/lib/api-auth";
import { emitNotificationViaWs, notifPayload } from "@/lib/notify-ws";
import { prisma } from "@/lib/prisma";

const MAX_SIZE_BYTES = 20 * 1024 * 1024;
const ALLOWED_TYPES = new Set(["video/webm", "video/mp4", "video/quicktime"]);
const UPLOAD_DIR = join(process.cwd(), "public/uploads/movement-videos");

async function ensureUploadDir() {
  if (!existsSync(UPLOAD_DIR)) {
    mkdirSync(UPLOAD_DIR, { recursive: true });
  }
}

export async function POST(request: Request) {
  try {
    const auth = await requireAuth("CLIENT");
    if ("error" in auth) return auth.error;

    const userId = auth.session.user.id;

    const formData = await request.formData();
    const videoFile = formData.get("video") as File | null;
    const durationSeconds = Number(formData.get("durationSeconds")) || 0;
    const movementNameRaw = String(formData.get("movementName") || "").trim();
    const questionRaw = String(formData.get("question") || "").trim();

    if (!videoFile) {
      return NextResponse.json({ error: "Video dosyası gereklidir." }, { status: 400 });
    }

    if (!movementNameRaw || movementNameRaw.length < 2) {
      return NextResponse.json({ error: "Hareket adı en az 2 karakter olmalıdır." }, { status: 400 });
    }

    if (!questionRaw || questionRaw.length < 5) {
      return NextResponse.json({ error: "Açıklama/soru en az 5 karakter olmalıdır." }, { status: 400 });
    }

    if (!ALLOWED_TYPES.has(videoFile.type)) {
      return NextResponse.json({ error: "Sadece WebM, MP4 veya MOV formatı desteklenmektedir." }, { status: 400 });
    }

    if (videoFile.size > MAX_SIZE_BYTES) {
      return NextResponse.json({ error: `Video dosyası en fazla ${MAX_SIZE_BYTES / 1024 / 1024}MB olabilir.` }, { status: 400 });
    }

    if (durationSeconds < 2 || durationSeconds > 90) {
      return NextResponse.json({ error: "Video uzunluğu 2-90 saniye arasında olmalıdır." }, { status: 400 });
    }

    const relation = await prisma.coachClientRelation.findFirst({
      where: { clientId: userId, status: "ACCEPTED" },
      select: { coachId: true },
      orderBy: { createdAt: "asc" },
    });

    if (!relation) {
      return NextResponse.json({ error: "Form analizi için atanmış bir koç bulunamadı." }, { status: 400 });
    }

    const latestWorkout = await prisma.workout.findFirst({
      where: { clientId: userId },
      orderBy: { startedAt: "desc" },
      select: { id: true },
    });

    if (!latestWorkout) {
      return NextResponse.json({ error: "Henüz kayıtlı bir antrenman bulunmadığı için video ilişkilendirilemedi." }, { status: 400 });
    }

    await ensureUploadDir();

    const ext = videoFile.type === "video/mp4" ? "mp4" : videoFile.type === "video/quicktime" ? "mov" : "webm";
    const timestamp = Date.now();
    const movementId = `free-${nanoid(10)}`;
    const filename = `${userId}-${movementId}-${timestamp}.${ext}`;
    const filepath = join(UPLOAD_DIR, filename);
    const publicPath = `/uploads/movement-videos/${filename}`;

    const buffer = Buffer.from(await videoFile.arrayBuffer());
    writeFileSync(filepath, buffer);

    const compactQuestion = questionRaw.length > 120 ? `${questionRaw.slice(0, 117)}...` : questionRaw;
    const displayMovementName = `FORM: ${movementNameRaw} | ${compactQuestion}`;

    const video = await prisma.movementVideo.create({
      data: {
        workoutId: latestWorkout.id,
        clientId: userId,
        coachId: relation.coachId,
        movementId,
        movementName: displayMovementName,
        videoPath: publicPath,
        fileSizeBytes: videoFile.size,
        durationSeconds,
      },
      select: {
        id: true,
        movementName: true,
        videoPath: true,
        createdAt: true,
      },
    });

    const notification = await prisma.notification.create({
      data: {
        userId: relation.coachId,
        title: "Yeni serbest form analizi isteği",
        body: `${auth.session.user.name ?? "Danışan"}: ${movementNameRaw}`,
        type: "VIDEO_UPLOADED",
      },
    });

    void emitNotificationViaWs(relation.coachId, notifPayload(notification));

    return NextResponse.json({ success: true, video }, { status: 201 });
  } catch (error) {
    console.error("[api/client/form-analysis] Upload failed", error);
    return NextResponse.json({ error: "Form analizi gönderilemedi." }, { status: 500 });
  }
}

import { NextResponse } from "next/server";
import { existsSync, mkdirSync, writeFileSync } from "fs";
import { join } from "path";
import { nanoid } from "nanoid";

import { requireAuth } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";

const MAX_SIZE_BYTES = 20 * 1024 * 1024;
const ALLOWED_TYPES = new Set(["video/webm", "video/mp4"]);
const UPLOAD_DIR = join(process.cwd(), "public/uploads/movement-videos");

async function ensureUploadDir() {
  if (!existsSync(UPLOAD_DIR)) {
    mkdirSync(UPLOAD_DIR, { recursive: true });
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ workoutId: string; movementId: string }> }
) {
  try {
    const auth = await requireAuth("CLIENT");
    if ("error" in auth) return auth.error;

    const userId = auth.session.user.id;
    const { workoutId, movementId } = await params;

    // Validate workout exists and belongs to authenticated client
    const workout = await prisma.workout.findUnique({
      where: { id: workoutId },
      select: { clientId: true },
    });

    if (!workout || workout.clientId !== userId) {
      return NextResponse.json(
        { error: "Antrenman bulunamadı veya erişim reddedildi." },
        { status: 403 }
      );
    }

    // Parse FormData
    const formData = await request.formData();
    const videoFile = formData.get("video") as File | null;
    const durationSeconds = Number(formData.get("durationSeconds")) || 0;
    const movementName = (formData.get("movementName") as string) || movementId;

    if (!videoFile) {
      return NextResponse.json(
        { error: "Video dosyası gereklidir." },
        { status: 400 }
      );
    }

    // Validate file type
    if (!ALLOWED_TYPES.has(videoFile.type)) {
      return NextResponse.json(
        { error: "Sadece WebM veya MP4 formatı desteklenmektedir." },
        { status: 400 }
      );
    }

    // Validate file size
    if (videoFile.size > MAX_SIZE_BYTES) {
      return NextResponse.json(
        { error: `Video dosyası en fazla ${MAX_SIZE_BYTES / 1024 / 1024}MB olabilir.` },
        { status: 400 }
      );
    }

    // Validate duration
    if (durationSeconds < 2 || durationSeconds > 30) {
      return NextResponse.json(
        { error: "Video uzunluğu 2-30 saniye arasında olmalıdır." },
        { status: 400 }
      );
    }

    // Ensure upload directory exists
    await ensureUploadDir();

    // Get file extension
    const ext = videoFile.type === "video/webm" ? "webm" : "mp4";
    const timestamp = Date.now();
    const filename = `${userId}-${movementId}-${timestamp}.${ext}`;
    const filepath = join(UPLOAD_DIR, filename);
    const publicPath = `/uploads/movement-videos/${filename}`;

    // Save file
    const buffer = Buffer.from(await videoFile.arrayBuffer());
    writeFileSync(filepath, buffer);

    // Get coach ID from client's coach relationship
    const clientCoachRelation = await prisma.coachClientRelation.findFirst({
      where: { clientId: userId, status: "ACCEPTED" },
      select: { coachId: true },
    });

    if (!clientCoachRelation) {
      return NextResponse.json(
        { error: "Atanmış bir koç bulunamadı." },
        { status: 400 }
      );
    }

    // Get client info for notification
    const client = await prisma.user.findUnique({
      where: { id: userId },
      select: { name: true },
    });

    // Create movement video record
    const video = await prisma.movementVideo.create({
      data: {
        workoutId,
        clientId: userId,
        coachId: clientCoachRelation.coachId,
        movementId,
        movementName,
        videoPath: publicPath,
        fileSizeBytes: videoFile.size,
        durationSeconds,
      },
      select: {
        id: true,
        videoPath: true,
        createdAt: true,
        movementName: true,
        durationSeconds: true,
      },
    });

    // Create notification for coach
    const coachId = clientCoachRelation.coachId;
    const notification = await prisma.notification.create({
      data: {
        userId: coachId,
        title: `${client?.name || "İstemci"} yeni video yükledi`,
        body: `${movementName} hareketi için video hazır`,
        type: "VIDEO_UPLOADED",
      },
    });

    // Emit WebSocket notification to coach
    try {
      await fetch("http://localhost:3001/internal/notify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: coachId,
          notification: {
            id: notification.id,
            title: notification.title,
            body: notification.body,
            type: notification.type,
            isRead: false,
            createdAt: notification.createdAt.toISOString(),
          },
        }),
      });
    } catch (err) {
      console.error("[api/movement-videos] WebSocket notification failed", err);
    }

    return NextResponse.json({
      success: true,
      video,
    });
  } catch (error) {
    console.error("[api/workouts/[id]/movements/[id]/video] Upload failed", error);
    return NextResponse.json(
      { error: "Video yüklemesi başarısız oldu." },
      { status: 500 }
    );
  }
}

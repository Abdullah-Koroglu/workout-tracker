import { NextResponse } from "next/server";

import { requireAuth } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";

const MAX_COMMENT_LENGTH = 2000;

export async function POST(
  request: Request,
  { params }: { params: Promise<{ videoId: string }> }
) {
  try {
    const auth = await requireAuth("COACH");
    if ("error" in auth) return auth.error;

    const coachId = auth.session.user.id;
    const { videoId } = await params;

    // Parse request body
    const body = await request.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return NextResponse.json(
        { error: "Geçersiz istek." },
        { status: 400 }
      );
    }

    const { content } = body;

    // Validate content
    if (!content || typeof content !== "string") {
      return NextResponse.json(
        { error: "Yorum metni gereklidir." },
        { status: 400 }
      );
    }

    const trimmedContent = content.trim();
    if (trimmedContent.length === 0 || trimmedContent.length > MAX_COMMENT_LENGTH) {
      return NextResponse.json(
        { error: `Yorum 1-${MAX_COMMENT_LENGTH} karakter arasında olmalıdır.` },
        { status: 400 }
      );
    }

    // Verify video exists and coach owns it
    const video = await prisma.movementVideo.findUnique({
      where: { id: videoId },
      select: { coachId: true, clientId: true },
    });

    if (!video) {
      return NextResponse.json(
        { error: "Video bulunamadı." },
        { status: 404 }
      );
    }

    if (video.coachId !== coachId) {
      return NextResponse.json(
        { error: "Bu videoya yorum yapma izniniz yok." },
        { status: 403 }
      );
    }

    // Get coach name for notification
    const coach = await prisma.user.findUnique({
      where: { id: coachId },
      select: { name: true },
    });

    // Create comment
    const comment = await prisma.movementVideoComment.create({
      data: {
        videoId,
        coachId,
        content: trimmedContent,
      },
      select: {
        id: true,
        content: true,
        createdAt: true,
        coach: { select: { name: true } },
      },
    });

    // Create notification for client
    const clientId = video.clientId;
    const notification = await prisma.notification.create({
      data: {
        userId: clientId,
        title: `${coach?.name || "Koç"} video hakkında yorum yaptı`,
        body: trimmedContent.slice(0, 100),
        type: "VIDEO_COMMENT",
      },
    });

    // Emit WebSocket notification to client
    try {
      await fetch("http://localhost:3001/internal/notify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: clientId,
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
      console.error("[api/movement-videos/comments] WebSocket notification failed", err);
    }

    return NextResponse.json({
      success: true,
      comment: {
        id: comment.id,
        coachName: comment.coach.name,
        content: comment.content,
        createdAt: comment.createdAt,
      },
    });
  } catch (error) {
    console.error("[api/movement-videos/[id]/comments] Create failed", error);
    return NextResponse.json(
      { error: "Yorum eklenemedi." },
      { status: 500 }
    );
  }
}

import { NextResponse } from "next/server";

import { requireAuth } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ videoId: string }> }
) {
  try {
    const auth = await requireAuth();
    if ("error" in auth) return auth.error;

    const userId = auth.session.user.id;
    const { videoId } = await params;

    // Fetch video with details
    const video = await prisma.movementVideo.findUnique({
      where: { id: videoId },
      include: {
        client: { select: { id: true, name: true, email: true } },
        comments: {
          select: {
            id: true,
            content: true,
            createdAt: true,
            coach: { select: { id: true, name: true } },
          },
          orderBy: { createdAt: "asc" },
        },
      },
    });

    if (!video) {
      return NextResponse.json(
        { error: "Video bulunamadı." },
        { status: 404 }
      );
    }

    // Verify access: coach who owns video or client who recorded it
    if (video.coachId !== userId && video.clientId !== userId) {
      return NextResponse.json(
        { error: "Bu videoya erişim izniniz yok." },
        { status: 403 }
      );
    }

    // Mark as watched if coach is viewing
    if (video.coachId === userId && !video.watchedByCoach) {
      await prisma.movementVideo.update({
        where: { id: videoId },
        data: {
          watchedByCoach: true,
          watchedAt: new Date(),
        },
      });
      video.watchedByCoach = true;
      video.watchedAt = new Date();
    }

    return NextResponse.json({
      video: {
        id: video.id,
        clientId: video.clientId,
        clientName: video.client.name,
        clientEmail: video.client.email,
        movementName: video.movementName,
        workoutId: video.workoutId,
        videoPath: video.videoPath,
        durationSeconds: video.durationSeconds,
        watchedByCoach: video.watchedByCoach,
        createdAt: video.createdAt,
        comments: video.comments.map((c) => ({
          id: c.id,
          coachName: c.coach.name,
          content: c.content,
          createdAt: c.createdAt,
        })),
      },
    });
  } catch (error) {
    console.error("[api/movement-videos/[id]] Fetch failed", error);
    return NextResponse.json(
      { error: "Video yüklenemedi." },
      { status: 500 }
    );
  }
}

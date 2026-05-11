import { NextResponse } from "next/server";

import { requireAuth } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ clientId: string }> }
) {
  try {
    const auth = await requireAuth("COACH");
    if ("error" in auth) return auth.error;

    const coachId = auth.session.user.id;
    const { clientId } = await params;

    // Verify coach manages this client
    const clientRelation = await prisma.coachClientRelation.findUnique({
      where: {
        coachId_clientId: { coachId, clientId },
      },
    });

    if (!clientRelation || clientRelation.status !== "ACCEPTED") {
      return NextResponse.json(
        { error: "Bu istemciye erişim izniniz yok." },
        { status: 403 }
      );
    }

    // Parse query params
    const url = new URL(request.url);
    const watched = url.searchParams.get("watched") ?? "all"; // "true", "false", or "all"
    const limit = Math.min(Number(url.searchParams.get("limit")) || 50, 250);
    const offset = Number(url.searchParams.get("offset")) || 0;

    // Build where clause
    const whereClause: { clientId: string; watchedByCoach?: boolean } = { clientId };
    if (watched === "true") {
      whereClause.watchedByCoach = true;
    } else if (watched === "false") {
      whereClause.watchedByCoach = false;
    }

    // Fetch videos count
    const total = await prisma.movementVideo.count({
      where: whereClause,
    });

    // Fetch videos
    const videos = await prisma.movementVideo.findMany({
      where: whereClause,
      select: {
        id: true,
        movementName: true,
        workoutId: true,
        videoPath: true,
        watchedByCoach: true,
        createdAt: true,
        durationSeconds: true,
        _count: { select: { comments: true } },
      },
      orderBy: { createdAt: "desc" },
      take: limit,
      skip: offset,
    });

    // Count unread videos
    const unreadCount = await prisma.movementVideo.count({
      where: { ...whereClause, watchedByCoach: false },
    });

    return NextResponse.json({
      videos: videos.map((v) => ({
        id: v.id,
        movementName: v.movementName,
        workoutId: v.workoutId,
        videoPath: v.videoPath,
        watchedByCoach: v.watchedByCoach,
        createdAt: v.createdAt,
        durationSeconds: v.durationSeconds,
        commentCount: v._count.comments,
      })),
      total,
      unreadCount,
    });
  } catch (error) {
    console.error("[api/coach/clients/[id]/movement-videos] Fetch failed", error);
    return NextResponse.json(
      { error: "Videolar yüklenemedi." },
      { status: 500 }
    );
  }
}

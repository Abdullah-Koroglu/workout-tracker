import { NextResponse } from "next/server";

import { requireAuth } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ videoId: string }> }
) {
  try {
    const auth = await requireAuth("COACH");
    if ("error" in auth) return auth.error;

    const coachId = auth.session.user.id;
    const { videoId } = await params;

    // Verify video exists and coach owns it
    const video = await prisma.movementVideo.findUnique({
      where: { id: videoId },
      select: { coachId: true },
    });

    if (!video) {
      return NextResponse.json(
        { error: "Video bulunamadı." },
        { status: 404 }
      );
    }

    if (video.coachId !== coachId) {
      return NextResponse.json(
        { error: "Bu videoya erişim izniniz yok." },
        { status: 403 }
      );
    }

    // Mark as watched
    await prisma.movementVideo.update({
      where: { id: videoId },
      data: {
        watchedByCoach: true,
        watchedAt: new Date(),
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[api/movement-videos/[id]/watched] Update failed", error);
    return NextResponse.json(
      { error: "Video güncellenemedi." },
      { status: 500 }
    );
  }
}

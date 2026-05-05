import { NextResponse } from "next/server";

import { requireAuth } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import { commentUpdateSchema } from "@/validations/subscription";

async function findAuthorizedComment(coachId: string, workoutId: string, commentId: string) {
  const comment = await prisma.comment.findFirst({
    where: {
      id: commentId,
      workoutId,
      authorId: coachId,
      workout: {
        client: {
          clientRelations: {
            some: { coachId, status: "ACCEPTED" },
          },
        },
      },
    },
    select: {
      id: true,
      content: true,
      workoutId: true,
    },
  });

  return comment;
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ workoutId: string; commentId: string }> },
) {
  try {
    const auth = await requireAuth("COACH");
    if (auth.error) return auth.error;

    const { workoutId, commentId } = await params;
    const body = await request.json().catch(() => ({}));
    const parsed = commentUpdateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const comment = await findAuthorizedComment(auth.session.user.id, workoutId, commentId);
    if (!comment) {
      return NextResponse.json({ error: "Comment not found" }, { status: 404 });
    }

    const updated = await prisma.comment.update({
      where: { id: commentId },
      data: { content: parsed.data.content },
    });

    return NextResponse.json({ comment: updated });
  } catch (error) {
    console.error("[api/coach/workouts/comments] Failed to update comment", error);
    return NextResponse.json({ error: "Yorum güncellenemedi." }, { status: 500 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ workoutId: string; commentId: string }> },
) {
  try {
    const auth = await requireAuth("COACH");
    if (auth.error) return auth.error;

    const { workoutId, commentId } = await params;
    const comment = await findAuthorizedComment(auth.session.user.id, workoutId, commentId);
    if (!comment) {
      return NextResponse.json({ error: "Comment not found" }, { status: 404 });
    }

    await prisma.comment.delete({ where: { id: commentId } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[api/coach/workouts/comments] Failed to delete comment", error);
    return NextResponse.json({ error: "Yorum silinemedi." }, { status: 500 });
  }
}
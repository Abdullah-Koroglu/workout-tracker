import { NextResponse } from "next/server";

import { requireAuth } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAuth("COACH");
  if (auth.error) return auth.error;

  const { id } = await params;
  const body = await request.json();
  const clientId = String(body.clientId || "");
  const scheduledForRaw = body.scheduledFor ? new Date(String(body.scheduledFor)) : null;

  if (!scheduledForRaw || Number.isNaN(scheduledForRaw.getTime())) {
    return NextResponse.json({ error: "Geçerli bir antrenman günü seçin." }, { status: 400 });
  }

  scheduledForRaw.setHours(0, 0, 0, 0);

  const scheduledForEnd = new Date(scheduledForRaw);
  scheduledForEnd.setDate(scheduledForEnd.getDate() + 1);

  const [template, relation, existingAssignment] = await Promise.all([
    prisma.workoutTemplate.findFirst({
      where: {
        id,
        coachId: auth.session.user.id
      }
    }),
    prisma.coachClientRelation.findFirst({
      where: {
        coachId: auth.session.user.id,
        clientId,
        status: "ACCEPTED"
      }
    }),
    prisma.templateAssignment.findFirst({
      where: {
        templateId: id,
        clientId,
        scheduledFor: {
          gte: scheduledForRaw,
          lt: scheduledForEnd
        }
      },
      orderBy: { createdAt: "desc" }
    })
  ]);

  if (!template) {
    return NextResponse.json({ error: "Template bulunamadı." }, { status: 404 });
  }

  if (!relation) {
    return NextResponse.json({ error: "Bu client ile aktif bir bağlantı yok." }, { status: 400 });
  }

  if (existingAssignment) {
    return NextResponse.json({ error: "Bu template zaten client'a atanmış." }, { status: 409 });
  }

  const assignment = await prisma.templateAssignment.create({
    data: {
      templateId: id,
      clientId,
      assignedBy: auth.session.user.id,
      scheduledFor: scheduledForRaw,
      isOneTime: true
    }
  });

  return NextResponse.json({ assignment }, { status: 201 });
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAuth("COACH");
  if (auth.error) return auth.error;

  const { id } = await params;
  const body = await request.json();
  const assignmentId = String(body.assignmentId || "");

  if (!assignmentId) {
    return NextResponse.json({ error: "Assignment ID gereklidir." }, { status: 400 });
  }

  // Verify the template belongs to this coach
  const template = await prisma.workoutTemplate.findFirst({
    where: {
      id,
      coachId: auth.session.user.id
    }
  });

  if (!template) {
    return NextResponse.json({ error: "Template bulunamadı." }, { status: 404 });
  }

  // Find assignment and ensure it belongs to coach template
  const assignment = await prisma.templateAssignment.findFirst({
    where: {
      id: assignmentId,
      templateId: id
    },
    include: {
      _count: {
        select: {
          workouts: true
        }
      }
    }
  });

  if (!assignment) {
    return NextResponse.json({ error: "Assignment bulunamadı." }, { status: 404 });
  }

  if (assignment._count.workouts > 0) {
    return NextResponse.json(
      { error: "Başlamış antrenmana ait assignment iptal edilemez." },
      { status: 409 }
    );
  }

  // Delete the assignment
  const deletedAssignment = await prisma.templateAssignment.delete({
    where: { id: assignmentId }
  });

  return NextResponse.json({ assignment: deletedAssignment });
}

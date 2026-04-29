import { NextResponse } from "next/server";
import { createElement } from "react";
import { Prisma } from "@prisma/client";

import { requireAuth } from "@/lib/api-auth";
import { sendTemplatedEmail } from "@/lib/email/send-email";
import { AssignmentEmail } from "@/lib/email/templates";
import { prisma } from "@/lib/prisma";
import { emitNotificationViaWs, notifPayload } from "@/lib/notify-ws";
import { sendPushNotification } from "@/lib/push-notifications";

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

  const [client, coach] = await Promise.all([
    prisma.user.findUnique({
      where: { id: clientId },
      select: { email: true, name: true, role: true, pushSubscription: true }
    }),
    prisma.user.findUnique({
      where: { id: auth.session.user.id },
      select: { name: true }
    })
  ]);

  if (client && client.role === "CLIENT") {
    // In-app notification + WS real-time
    const assignNotif = await prisma.notification.create({
      data: {
        userId: clientId,
        title: "Yeni antrenman atandı",
        body: `${coach?.name ?? "Koçun"} sana "${template.name}" programını ${scheduledForRaw.toLocaleDateString("tr-TR")} için atadı.`,
        type: "NEW_ASSIGNMENT",
      },
    });
    void emitNotificationViaWs(clientId, notifPayload(assignNotif));

    const pushResult = await sendPushNotification(client.pushSubscription, {
      title: "Yeni antrenman atandı",
      body: `${coach?.name ?? "Koçun"} sana "${template.name}" programını atadı.`,
      url: "/client/dashboard"
    });

    if (pushResult.expired) {
      await prisma.user.update({
        where: { id: clientId },
        data: { pushSubscription: Prisma.DbNull }
      });
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXTAUTH_URL || "https://fitcoach.akoroglu.com.tr";

    await sendTemplatedEmail({
      to: client.email,
      subject: "Yeni antrenman atandi",
      template: createElement(AssignmentEmail, {
        clientName: client.name,
        coachName: coach?.name || "Coach",
        templateName: template.name,
        scheduledDateLabel: scheduledForRaw.toLocaleDateString("tr-TR"),
        dashboardUrl: `${appUrl}/client/dashboard`
      })
    });
  }

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

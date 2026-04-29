import { NextResponse } from "next/server";

import { requireAuth } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const auth = await requireAuth();
  if ("error" in auth) return auth.error;

  const notifications = await prisma.notification.findMany({
    where: { userId: auth.session.user.id },
    orderBy: { createdAt: "desc" },
    take: 30,
  });

  const unreadCount = await prisma.notification.count({
    where: { userId: auth.session.user.id, isRead: false },
  });

  return NextResponse.json({ notifications, unreadCount });
}

export async function PATCH(request: Request) {
  const auth = await requireAuth();
  if ("error" in auth) return auth.error;

  const body = await request.json().catch(() => ({}));
  const notificationId: string | undefined =
    typeof body.id === "string" ? body.id : undefined;

  if (notificationId) {
    await prisma.notification.updateMany({
      where: { id: notificationId, userId: auth.session.user.id },
      data: { isRead: true },
    });
  } else {
    // Mark all as read
    await prisma.notification.updateMany({
      where: { userId: auth.session.user.id, isRead: false },
      data: { isRead: true },
    });
  }

  return NextResponse.json({ success: true });
}

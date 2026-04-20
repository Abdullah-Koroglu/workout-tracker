import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/api-auth";
import { sendPushNotification } from "@/lib/push-notifications";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  const auth = await requireAuth();
  if (auth.error) return auth.error;

  const user = await prisma.user.findUnique({
    where: { id: auth.session.user.id },
    select: { pushSubscription: true }
  });

  if (!user?.pushSubscription) {
    return NextResponse.json(
      { error: "Push subscription bulunamadı" },
      { status: 400 }
    );
  }

  const result = await sendPushNotification(user.pushSubscription, {
    title: "Test Notification 🧪",
    body: "Bu bir test push notificationdır!",
    url: "/"
  });

  return NextResponse.json({ 
    success: result.delivered,
    message: result.expired ? "Subscription expired" : "Test push gönderildi"
  });
}
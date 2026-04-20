"use server";

import { sendPushNotification } from "@/lib/push-notifications";
import { requireAuth } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";

export async function sendTestPush() {
  const auth = await requireAuth();
  if (auth.error) return { error: "Auth failed" };

  const user = await prisma.user.findUnique({
    where: { id: auth.session.user.id },
    select: { pushSubscription: true }
  });

  if (!user?.pushSubscription) {
    return { error: "Push subscription yok" };
  }

  const result = await sendPushNotification(user.pushSubscription, {
    title: "🎉 Test Push!",
    body: "Notification sistemi çalışıyor!"
  });

  return { success: result.delivered };
}
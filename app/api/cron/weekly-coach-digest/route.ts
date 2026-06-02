import { NextResponse } from "next/server";
import { createElement } from "react";

import { prisma } from "@/lib/prisma";
import { sendTemplatedEmail } from "@/lib/email/send-email";
import { WeeklyDigestEmail } from "@/lib/email/templates";
import { buildCoachWeeklyDigest, getPreviousWeekRange, saveCoachWeeklyDigestSnapshot } from "@/lib/coach-weekly-digest";

export async function POST(request: Request) {
  const cronSecret = process.env.CRON_SECRET;
  const provided = request.headers.get("x-cron-secret");

  if (!cronSecret || provided !== cronSecret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const range = getPreviousWeekRange();

  const coaches = await prisma.user.findMany({
    where: { role: "COACH" },
    select: { id: true, email: true, name: true }
  });

  let sentCount = 0;

  for (const coach of coaches) {
    const digest = await buildCoachWeeklyDigest(coach.id, range);
    if (!digest.activeClients) {
      continue;
    }
    await saveCoachWeeklyDigestSnapshot(digest);

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXTAUTH_URL || "https://fitcoach.akoroglu.com.tr";

    const result = await sendTemplatedEmail({
      to: coach.email,
      subject: `Haftalik Ozet - %${digest.completionRate} Tamamlanma`,
      template: createElement(WeeklyDigestEmail, {
        coachName: coach.name,
        weekLabel: digest.weekLabel,
        completionRate: digest.completionRate,
        completedCount: digest.completedCount,
        abandonedCount: digest.abandonedCount,
        activeClients: digest.activeClients,
        prCount: digest.prCount,
        nutritionAdherenceRate: digest.nutritionAdherenceRate,
        atRiskCount: digest.atRiskClients.length,
        suggestedActions: digest.suggestedActions,
        dashboardUrl: `${appUrl}/coach/dashboard`
      })
    });

    if (result.sent) {
      sentCount += 1;
    }
  }

  return NextResponse.json({ success: true, sentCount });
}

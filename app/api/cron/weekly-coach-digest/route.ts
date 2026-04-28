import { NextResponse } from "next/server";
import { createElement } from "react";

import { prisma } from "@/lib/prisma";
import { sendTemplatedEmail } from "@/lib/email/send-email";
import { WeeklyDigestEmail } from "@/lib/email/templates";

function getPreviousWeekRange() {
  const now = new Date();
  const day = now.getDay();
  const mondayOffset = (day + 6) % 7;

  const thisMonday = new Date(now);
  thisMonday.setDate(now.getDate() - mondayOffset);
  thisMonday.setHours(0, 0, 0, 0);

  const lastMonday = new Date(thisMonday);
  lastMonday.setDate(thisMonday.getDate() - 7);

  const thisMondayEnd = new Date(thisMonday);

  return { start: lastMonday, end: thisMondayEnd };
}

export async function POST(request: Request) {
  const cronSecret = process.env.CRON_SECRET;
  const provided = request.headers.get("x-cron-secret");

  if (!cronSecret || provided !== cronSecret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { start, end } = getPreviousWeekRange();

  const coaches = await prisma.user.findMany({
    where: { role: "COACH" },
    select: { id: true, email: true, name: true }
  });

  let sentCount = 0;

  for (const coach of coaches) {
    const relations = await prisma.coachClientRelation.findMany({
      where: {
        coachId: coach.id,
        status: "ACCEPTED"
      },
      select: { clientId: true }
    });

    const clientIds = relations.map((item) => item.clientId);
    if (!clientIds.length) {
      continue;
    }

    const [completedCount, abandonedCount] = await Promise.all([
      prisma.workout.count({
        where: {
          clientId: { in: clientIds },
          status: "COMPLETED",
          finishedAt: {
            gte: start,
            lt: end
          }
        }
      }),
      prisma.workout.count({
        where: {
          clientId: { in: clientIds },
          status: "ABANDONED",
          finishedAt: {
            gte: start,
            lt: end
          }
        }
      })
    ]);

    const totalRelevant = completedCount + abandonedCount;
    const completionRate = totalRelevant > 0 ? Math.round((completedCount / totalRelevant) * 100) : 0;

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXTAUTH_URL || "https://fitcoach.akoroglu.com.tr";

    const result = await sendTemplatedEmail({
      to: coach.email,
      subject: `Haftalik Ozet - %${completionRate} Tamamlanma`,
      template: createElement(WeeklyDigestEmail, {
        coachName: coach.name,
        weekLabel: `${start.toLocaleDateString("tr-TR")} - ${new Date(end.getTime() - 1).toLocaleDateString("tr-TR")}`,
        completionRate,
        completedCount,
        abandonedCount,
        activeClients: clientIds.length,
        dashboardUrl: `${appUrl}/coach/dashboard`
      })
    });

    if (result.sent) {
      sentCount += 1;
    }
  }

  return NextResponse.json({ success: true, sentCount });
}

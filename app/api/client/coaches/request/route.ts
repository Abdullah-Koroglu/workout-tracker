import { NextResponse } from "next/server";
import { createElement } from "react";
import { z } from "zod";

import { requireAuth } from "@/lib/api-auth";
import { sendTemplatedEmail } from "@/lib/email/send-email";
import { CoachRequestEmail } from "@/lib/email/templates";
import { prisma } from "@/lib/prisma";

const schema = z.object({
  coachId: z.string().min(1)
});

export async function POST(request: Request) {
  const auth = await requireAuth("CLIENT");
  if (auth.error) return auth.error;

  const body = await request.json();
  const parsed = schema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const existingRelation = await prisma.coachClientRelation.findUnique({
    where: {
      coachId_clientId: {
        coachId: parsed.data.coachId,
        clientId: auth.session.user.id
      }
    },
    select: {
      status: true
    }
  });

  const relation = await prisma.coachClientRelation.upsert({
    where: {
      coachId_clientId: {
        coachId: parsed.data.coachId,
        clientId: auth.session.user.id
      }
    },
    update: { status: "PENDING" },
    create: {
      coachId: parsed.data.coachId,
      clientId: auth.session.user.id,
      status: "PENDING"
    }
  });

  const shouldNotifyCoach = !existingRelation || existingRelation.status !== "PENDING";

  if (shouldNotifyCoach) {
    const coach = await prisma.user.findUnique({
      where: { id: parsed.data.coachId },
      select: { email: true, name: true, role: true }
    });

    if (coach && coach.role === "COACH") {
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXTAUTH_URL || "http://localhost:3000";

      await sendTemplatedEmail({
        to: coach.email,
        subject: "Yeni client istegi aldin",
        template: createElement(CoachRequestEmail, {
          coachName: coach.name,
          clientName: auth.session.user.name || "Client",
          dashboardUrl: `${appUrl}/coach/dashboard`
        })
      });
    }
  }

  return NextResponse.json({ relation }, { status: 201 });
}

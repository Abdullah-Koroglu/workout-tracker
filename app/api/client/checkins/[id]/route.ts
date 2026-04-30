import { NextResponse } from "next/server";
import { z } from "zod";

import { requireAuth } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import { emitNotificationViaWs, notifPayload } from "@/lib/notify-ws";

const responseSchema = z.object({
  sleepScore:      z.number().int().min(1).max(5),
  stressScore:     z.number().int().min(1).max(5),
  motivationScore: z.number().int().min(1).max(5),
  notes:           z.string().max(500).optional(),
});

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth("CLIENT");
  if (auth.error) return auth.error;

  const { id } = await params;

  const checkIn = await prisma.checkIn.findUnique({
    where: { id },
    select: { id: true, clientId: true, coachId: true, response: true },
  });

  if (!checkIn || checkIn.clientId !== auth.session.user.id) {
    return NextResponse.json({ error: "Check-in bulunamadı." }, { status: 404 });
  }

  if (checkIn.response) {
    return NextResponse.json({ error: "Bu check-in zaten yanıtlandı." }, { status: 409 });
  }

  const body = await request.json().catch(() => ({}));
  const parsed = responseSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const response = await prisma.checkInResponse.create({
    data: {
      checkInId:       id,
      sleepScore:      parsed.data.sleepScore,
      stressScore:     parsed.data.stressScore,
      motivationScore: parsed.data.motivationScore,
      notes:           parsed.data.notes ?? null,
    },
  });

  const clientName = auth.session.user.name ?? "Danışan";

  const notif = await prisma.notification.create({
    data: {
      userId: checkIn.coachId,
      title: `${clientName} check-in formunu doldurdu`,
      body: `Uyku: ${parsed.data.sleepScore}/5 · Stres: ${parsed.data.stressScore}/5 · Motivasyon: ${parsed.data.motivationScore}/5`,
      type: "CHECKIN_RESPONSE",
    },
  });

  void emitNotificationViaWs(checkIn.coachId, notifPayload(notif));

  return NextResponse.json({ response }, { status: 201 });
}

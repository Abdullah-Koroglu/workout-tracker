import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import OpenAI from "openai";

import { requireAuth } from "@/lib/api-auth";
import { emitNotificationViaWs, notifPayload } from "@/lib/notify-ws";
import { prisma } from "@/lib/prisma";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const AI_SYSTEM_PROMPT =
  "Sen profesyonel bir diyetisyenin yapay zeka asistanısın. Görevin, danışanın girdiği öğün notunu (clientNote) ve diyet uyum etiketini (adherenceTag: GREEN, YELLOW veya RED) analiz etmektir. Danışanın psikolojik durumunu, diyete uyumunu ve varsa diyetten kopma riskini çıkar. Koç için çok kısa (maksimum 2 cümle) klinik, profesyonel ve aksiyon alınabilir bir özet/uyarı yaz. Yanıtın doğrudan koça hitap etmeli.";

async function generateAiSummary(
  adherenceTag: AdherenceTag,
  clientNote: string | null
): Promise<string | null> {
  if (!clientNote || clientNote.trim().length < 3) return null;

  if (!process.env.OPENAI_API_KEY) {
    console.error("[NutritionLog] OPENAI_API_KEY missing; skipping AI summary.");
    return null;
  }

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.4,
      max_tokens: 160,
      messages: [
        { role: "system", content: AI_SYSTEM_PROMPT },
        {
          role: "user",
          content: `Adherence Tag: ${adherenceTag}. Client Note: ${clientNote}`,
        },
      ],
    });

    const text = completion.choices?.[0]?.message?.content?.trim();
    return text && text.length > 0 ? text : null;
  } catch (error) {
    console.error("[NutritionLog] OpenAI summary failed", error);
    return null;
  }
}

const MAX_SIZE_BYTES = 8 * 1024 * 1024;
const ALLOWED_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
  "image/heif",
]);
const ADHERENCE_TAGS = new Set(["GREEN", "YELLOW", "RED"] as const);
type AdherenceTag = "GREEN" | "YELLOW" | "RED";

const TAG_LABEL: Record<AdherenceTag, string> = {
  GREEN: "🟢 Plana uygun",
  YELLOW: "🟡 Hafif sapma",
  RED: "🔴 Plan dışı",
};

function sanitizeName(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]+/g, "_").slice(-60) || "meal";
}

function extensionFromMime(mime: string): string {
  if (mime === "image/jpeg") return "jpg";
  if (mime === "image/png") return "png";
  if (mime === "image/webp") return "webp";
  if (mime === "image/heic") return "heic";
  if (mime === "image/heif") return "heif";
  return "bin";
}

export async function GET() {
  const auth = await requireAuth("CLIENT");
  if (auth.error) return auth.error;

  const logs = await prisma.nutritionMealLog.findMany({
    where: { clientId: auth.session.user.id },
    orderBy: { loggedAt: "desc" },
    take: 30,
  });

  return NextResponse.json({ logs });
}

export async function POST(request: Request) {
  const auth = await requireAuth("CLIENT");
  if (auth.error) return auth.error;

  const contentType = request.headers.get("content-type") || "";
  if (!contentType.includes("multipart/form-data")) {
    return NextResponse.json({ error: "multipart/form-data bekleniyor." }, { status: 400 });
  }

  const formData = await request.formData().catch(() => null);
  if (!formData) {
    return NextResponse.json({ error: "Form verisi okunamadı." }, { status: 400 });
  }

  const adherenceRaw = String(formData.get("adherenceTag") ?? "");
  if (!ADHERENCE_TAGS.has(adherenceRaw as AdherenceTag)) {
    return NextResponse.json({ error: "Geçersiz adherenceTag." }, { status: 400 });
  }
  const adherenceTag = adherenceRaw as AdherenceTag;

  const clientNoteRaw = formData.get("clientNote");
  const clientNote =
    typeof clientNoteRaw === "string" && clientNoteRaw.trim().length
      ? clientNoteRaw.trim().slice(0, 2000)
      : null;

  const file = formData.get("file");
  let photoUrl: string | null = null;

  if (file instanceof File && file.size > 0) {
    if (!ALLOWED_TYPES.has(file.type)) {
      return NextResponse.json({ error: "Sadece JPG/PNG/WEBP/HEIC yüklenebilir." }, { status: 400 });
    }
    if (file.size > MAX_SIZE_BYTES) {
      return NextResponse.json({ error: "Dosya boyutu 8MB'den büyük olamaz." }, { status: 400 });
    }

    const uploadDir = path.join(process.cwd(), "public", "uploads", "meals");
    try {
      await fs.mkdir(uploadDir, { recursive: true });
    } catch (error) {
      console.error("[NutritionLog] mkdir failed", { uploadDir, error });
      return NextResponse.json({ error: "Klasör oluşturulamadı." }, { status: 500 });
    }

    const originalName =
      file.name && file.name !== "blob"
        ? sanitizeName(file.name)
        : `meal.${extensionFromMime(file.type)}`;
    const fileName = `${Date.now()}-${auth.session.user.id}-${originalName}`;
    const dest = path.join(uploadDir, fileName);

    try {
      const buffer = Buffer.from(await file.arrayBuffer());
      await fs.writeFile(dest, buffer);
    } catch (error) {
      console.error("[NutritionLog] writeFile failed", { dest, error });
      return NextResponse.json({ error: "Dosya kaydedilemedi." }, { status: 500 });
    }

    photoUrl = `/uploads/meals/${fileName}`;
  }

  const aiSummary = await generateAiSummary(adherenceTag, clientNote);

  const log = await prisma.nutritionMealLog.create({
    data: {
      clientId: auth.session.user.id,
      photoUrl,
      adherenceTag,
      clientNote,
      aiSummary,
    },
  });

  const relations = await prisma.coachClientRelation.findMany({
    where: { clientId: auth.session.user.id, status: "ACCEPTED" },
    select: { coachId: true },
  });

  await Promise.all(
    relations.map(async (relation) => {
      const notif = await prisma.notification.create({
        data: {
          userId: relation.coachId,
          title: "Yeni beslenme logu",
          body: `${auth.session.user.name ?? "Danışanın"} bir öğün paylaştı (${TAG_LABEL[adherenceTag]}).`,
          type: "NUTRITION_MEAL_LOG",
        },
      });
      void emitNotificationViaWs(relation.coachId, notifPayload(notif));
    })
  );

  return NextResponse.json({ log }, { status: 201 });
}

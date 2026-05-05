import { NextResponse } from "next/server";

import { requireAuth } from "@/lib/api-auth";
import { createSubscription, getPaymentProvider } from "@/lib/payment-service";
import { subscriptionCheckoutSchema } from "@/validations/subscription";

export async function POST(request: Request) {
  try {
    const auth = await requireAuth("COACH");
    if (auth.error) return auth.error;

    if (getPaymentProvider() !== "IYZICO") {
      return NextResponse.json({ error: "Iyzico sağlayıcısı aktif değil." }, { status: 400 });
    }

    const body = await request.json().catch(() => ({}));
    const parsed = subscriptionCheckoutSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const subscription = await createSubscription({
      userId: auth.session.user.id,
      origin: request.headers.get("origin") ?? process.env.NEXTAUTH_URL ?? "http://localhost:3000",
      tier: parsed.data.tier === "PRO" ? "TIER_1" : "TIER_2",
      cycle: parsed.data.cycle,
    });

    return NextResponse.json({ url: subscription.url, provider: subscription.provider, result: subscription.raw });
  } catch (error) {
    console.error("[api/coach/subscription/iyzico-checkout] Failed to initialize Iyzico checkout", error);
    return NextResponse.json({ error: "Iyzico ödeme formu başlatılamadı." }, { status: 500 });
  }
}
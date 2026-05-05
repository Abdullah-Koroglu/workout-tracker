import { NextResponse } from "next/server";

import { requireAuth } from "@/lib/api-auth";
import { getPortalUrl } from "@/lib/payment-service";

export async function POST(request: Request) {
  try {
    const auth = await requireAuth("COACH");
    if (auth.error) return auth.error;

    const portal = await getPortalUrl({
      userId: auth.session.user.id,
      origin: request.headers.get("origin") ?? process.env.NEXTAUTH_URL ?? "http://localhost:3000",
    });

    return NextResponse.json({ url: portal.url, provider: portal.provider, internal: portal.internal });
  } catch (error) {
    console.error("[api/coach/subscription/portal] Failed to open billing portal", error);
    return NextResponse.json({ error: "Faturalama portalı açılamadı." }, { status: 400 });
  }
}

import { NextResponse } from "next/server";

import { finalizeIyzicoCheckout } from "@/lib/payment-service";

function getRedirectUrl(request: Request, params: Record<string, string>) {
  const url = new URL("/coach/billing", request.url);

  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }

  return url;
}

async function handleCallback(request: Request) {
  const body = await request.text();
  const bodyParams = new URLSearchParams(body);
  const requestUrl = new URL(request.url);
  const token = requestUrl.searchParams.get("token")
    ?? requestUrl.searchParams.get("checkoutFormToken")
    ?? bodyParams.get("token")
    ?? bodyParams.get("checkoutFormToken");

  if (!token) {
    return NextResponse.redirect(getRedirectUrl(request, { provider: "iyzico", canceled: "1", error: "missing-token" }));
  }

  try {
    const result = await finalizeIyzicoCheckout({
      token,
      origin: requestUrl.origin,
    });

    return NextResponse.redirect(result.redirectUrl);
  } catch (error) {
    console.error("[api/webhooks/iyzico] Failed to finalize Iyzico checkout", error);
    return NextResponse.redirect(getRedirectUrl(request, { provider: "iyzico", canceled: "1", error: "callback-failed" }));
  }
}

export async function GET(request: Request) {
  return handleCallback(request);
}

export async function POST(request: Request) {
  return handleCallback(request);
}

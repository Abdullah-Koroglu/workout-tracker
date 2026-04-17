import crypto from "crypto";
import { NextResponse } from "next/server";

import { requireAuth } from "@/lib/api-auth";

function base64UrlEncode(input: string) {
  return Buffer.from(input)
    .toString("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
}

function createWsToken(userId: string) {
  const secret = process.env.WS_AUTH_SECRET || process.env.NEXTAUTH_SECRET || process.env.AUTH_SECRET;
  if (!secret) {
    return null;
  }

  const payload = {
    uid: userId,
    exp: Date.now() + 10 * 60 * 1000
  };

  const payloadPart = base64UrlEncode(JSON.stringify(payload));
  const signaturePart = crypto
    .createHmac("sha256", secret)
    .update(payloadPart)
    .digest("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");

  return `${payloadPart}.${signaturePart}`;
}

export async function GET() {
  const auth = await requireAuth();
  if (auth.error) return auth.error;

  const token = createWsToken(auth.session.user.id);
  if (!token) {
    return NextResponse.json({ error: "WS auth secret is missing" }, { status: 500 });
  }

  return NextResponse.json({ token, expiresInMs: 10 * 60 * 1000 });
}

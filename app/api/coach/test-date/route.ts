import { NextResponse } from "next/server";

import { requireAuth } from "@/lib/api-auth";
import {
  clearTestDateString,
  getTestDateString,
  setTestDateString
} from "@/lib/current-date";

export async function GET(request: Request) {
  const auth = await requireAuth("COACH");
  if (auth.error) return auth.error;

  const testDate = getTestDateString();
  return NextResponse.json({ testDate });
}

export async function POST(request: Request) {
  const auth = await requireAuth("COACH");
  if (auth.error) return auth.error;

  const body = await request.json();
  const { date } = body;

  if (!date) {
    clearTestDateString();
    return NextResponse.json({ testDate: null, message: "Test date cleared" });
  }

  // Validate date format (YYYY-MM-DD)
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return NextResponse.json({ error: "Geçersiz tarih formatı. YYYY-MM-DD kullanın." }, { status: 400 });
  }

  if (!setTestDateString(String(date))) {
    return NextResponse.json({ error: "Geçersiz tarih." }, { status: 400 });
  }

  return NextResponse.json({ testDate: date, message: "Test tarih ayarlandı" });
}

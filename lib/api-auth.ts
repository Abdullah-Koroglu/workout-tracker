import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";

export async function requireAuth(role?: "COACH" | "CLIENT") {
  const session = await auth();
  if (!session?.user) {
    return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }

  if (role && session.user.role !== role) {
    return { error: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  }

  return { session };
}

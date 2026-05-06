import { NextResponse } from "next/server";

import { requireAuth } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import { uploadUrlExists } from "@/lib/upload-files";

function parseDateParam(value: string | null): Date | null {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

export async function GET(request: Request) {
  const auth = await requireAuth("CLIENT");
  if (auth.error) return auth.error;

  const url = new URL(request.url);
  const startDate = parseDateParam(url.searchParams.get("startDate"));
  const endDate = parseDateParam(url.searchParams.get("endDate"));

  const loggedAtFilter: { gte?: Date; lte?: Date } = {};
  if (startDate) loggedAtFilter.gte = startDate;
  if (endDate) loggedAtFilter.lte = endDate;

  const logs = await prisma.nutritionMealLog.findMany({
    where: {
      clientId: auth.session.user.id,
      ...(startDate || endDate ? { loggedAt: loggedAtFilter } : {}),
    },
    orderBy: { loggedAt: "desc" },
  });

  const safeLogs = await Promise.all(
    logs.map(async (log) => ({
      ...log,
      photoUrl: (await uploadUrlExists(log.photoUrl)) ? log.photoUrl : null,
    }))
  );

  return NextResponse.json({ logs: safeLogs });
}

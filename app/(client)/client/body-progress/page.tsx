import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { BodyProgressClient } from "@/components/client/BodyProgressClient";
import type { BodyLog } from "@/components/client/BodyProgressClient";

export default async function BodyProgressPage() {
  const session = await auth();
  const clientId = session?.user.id ?? "";

  const [rawLogs, prefs] = await Promise.all([
    prisma.bodyMetricLog.findMany({
      where: { clientId },
      orderBy: { date: "desc" },
      select: {
        id: true,
        date: true,
        weight: true,
        shoulder: true,
        chest: true,
        waist: true,
        hips: true,
        arm: true,
        leg: true,
        frontPhotoUrl: true,
        sidePhotoUrl: true,
        backPhotoUrl: true,
        createdAt: true,
      },
    }),
    prisma.bodyTrackingPreference.findUnique({ where: { clientId } }),
  ]);

  const logs: BodyLog[] = rawLogs.map((l) => ({
    ...l,
    date: l.date.toISOString(),
    createdAt: l.createdAt.toISOString(),
  }));

  let activeMeasurements: string[] = [];
  if (prefs) {
    try {
      activeMeasurements = JSON.parse(prefs.activeMeasurements);
    } catch {
      activeMeasurements = [];
    }
  }

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <div
        className="-mx-4 px-5 pt-5 pb-7 -mt-4"
        style={{ background: "linear-gradient(160deg, #4C1D95, #6D28D9)" }}
      >
        <div className="flex items-center justify-between mb-4">
          <Link
            href="/client/dashboard"
            className="flex h-8 w-8 items-center justify-center rounded-xl"
            style={{ background: "rgba(255,255,255,0.15)" }}
          >
            <ChevronLeft className="h-4 w-4 text-white" />
          </Link>
          <span
            className="rounded-full px-3 py-1 text-[11px] font-black text-white"
            style={{ background: "rgba(255,255,255,0.15)" }}
          >
            {logs.length} kayıt
          </span>
        </div>
        <div>
          <p className="text-white/60 text-[12px] font-black uppercase tracking-widest">Dönüşüm Radarı</p>
          <h1 className="text-white text-[26px] font-black leading-tight mt-1">
            📏 Fiziksel İlerleme
          </h1>
          <p className="text-white/70 text-[13px] mt-1">
            Kilo · Ölçümler · Before/After
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="mt-5">
        <BodyProgressClient logs={logs} activeMeasurements={activeMeasurements} />
      </div>
    </div>
  );
}

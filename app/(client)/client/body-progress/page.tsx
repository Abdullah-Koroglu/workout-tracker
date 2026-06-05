import Link from "next/link";
import { ChevronLeft, Ruler } from "lucide-react";

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

  const logs: BodyLog[] = rawLogs.map((log) => ({
    ...log,
    date: log.date.toISOString(),
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
      <div
        className="-mx-4 -mt-4 px-5 pb-7 pt-5"
        style={{ background: "linear-gradient(160deg, #4C1D95, #6D28D9)" }}
      >
        <div className="mb-4 flex items-center justify-between">
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
            {logs.length} kayit
          </span>
        </div>

        <p className="text-[12px] font-black uppercase tracking-widest text-white/60">Donusum Radari</p>
        <div className="mt-1 flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/12 text-white">
            <Ruler className="h-5 w-5" />
          </div>
          <h1 className="text-[26px] font-black leading-tight text-white">Fiziksel Ilerleme</h1>
        </div>
        <p className="mt-1 text-[13px] text-white/70">Kilo · Olcumler · Before/After</p>
      </div>

      <div className="mt-5">
        <BodyProgressClient logs={logs} activeMeasurements={activeMeasurements} />
      </div>
    </div>
  );
}



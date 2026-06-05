import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { notFound } from "next/navigation";

import { ProgressCharts } from "@/components/coach/ProgressCharts";
import { VolumeHeatmap } from "@/components/coach/VolumeHeatmap";
import { prisma } from "@/lib/prisma";

export default async function ClientProgressPage({
  params,
}: {
  params: Promise<{ clientId: string }>;
}) {
  const { clientId } = await params;

  const client = await prisma.user.findUnique({
    where: { id: clientId },
    select: { name: true, email: true },
  });

  if (!client) return notFound();

  const exercises = await prisma.exercise.findMany({
    where: {
      workoutSets: {
        some: {
          workout: {
            clientId,
          },
        },
      },
    },
    select: {
      id: true,
      name: true,
    },
    orderBy: {
      name: "asc",
    },
  });

  const initials = client.name
    .split(" ")
    .map((part: string) => part[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  if (exercises.length === 0) {
    return (
      <div className="space-y-5 pb-[calc(var(--app-mobile-nav-height)+2rem)] md:pb-10">
        <section className="rounded-[24px] bg-secondary px-5 py-6 text-white shadow-md">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary text-xl font-black text-white shadow-md">
              {initials}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold uppercase tracking-widest text-white/60">Ilerleme Analizi</p>
              <h1 className="text-xl font-black">{client.name}</h1>
              <p className="mt-0.5 truncate text-sm text-white/60">{client.email}</p>
            </div>
            <Link
              href={`/coach/clients/${clientId}`}
              className="inline-flex items-center gap-1 rounded-xl bg-white/10 px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-white/20"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
              Geri
            </Link>
          </div>
        </section>

        <div className="rounded-[24px] border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500">
          Henuz tamamlanan workout bulunamadi.
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5 pb-[calc(var(--app-mobile-nav-height)+2rem)] md:pb-10">
      <section className="rounded-[24px] bg-secondary px-5 py-6 text-white shadow-md">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary text-xl font-black text-white shadow-md">
            {initials}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold uppercase tracking-widest text-white/60">Ilerleme Analizi</p>
            <h1 className="text-xl font-black">{client.name}</h1>
            <p className="mt-0.5 truncate text-sm text-white/60">{client.email}</p>
          </div>
          <Link
            href={`/coach/clients/${clientId}`}
            className="inline-flex items-center gap-1 rounded-xl bg-white/10 px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-white/20"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
            Geri
          </Link>
        </div>
      </section>

      <div className="grid gap-5">
        <VolumeHeatmap clientId={clientId} />
        <ProgressCharts clientId={clientId} exercises={exercises} />
      </div>
    </div>
  );
}

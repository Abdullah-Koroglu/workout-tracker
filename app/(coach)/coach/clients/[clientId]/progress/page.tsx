import { ProgressCharts } from "@/components/coach/ProgressCharts";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";

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

  // Get all exercises that have been completed by this client
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

  if (exercises.length === 0) {
    return (
      <div className="space-y-5">
        <section className="rounded-2xl bg-secondary px-5 py-6 text-white shadow-md">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-primary flex items-center justify-center text-white text-xl font-black flex-shrink-0 shadow-md">
              {client.name.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2)}
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-white/60">İlerleme Analizi</p>
              <h1 className="text-xl font-black">{client.name}</h1>
              <p className="text-sm text-white/60 mt-0.5">{client.email}</p>
            </div>
            <Link href={`/coach/clients/${clientId}`} className="ml-auto flex items-center gap-1 rounded-xl bg-white/10 hover:bg-white/20 transition-colors px-3 py-2 text-xs font-semibold text-white flex-shrink-0">
              <ChevronLeft className="w-3.5 h-3.5" />
              Geri
            </Link>
          </div>
        </section>
        <div className="rounded-xl bg-muted/40 p-8 text-center">
          <p className="text-muted-foreground">Henüz tamamlanan workout bulunamadı.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <section className="rounded-2xl bg-secondary px-5 py-6 text-white shadow-md">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-primary flex items-center justify-center text-white text-xl font-black flex-shrink-0 shadow-md">
            {client.name.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2)}
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-white/60">İlerleme Analizi</p>
            <h1 className="text-xl font-black">{client.name}</h1>
            <p className="text-sm text-white/60 mt-0.5">{client.email}</p>
          </div>
          <Link href={`/coach/clients/${clientId}`} className="ml-auto flex items-center gap-1 rounded-xl bg-white/10 hover:bg-white/20 transition-colors px-3 py-2 text-xs font-semibold text-white flex-shrink-0">
            <ChevronLeft className="w-3.5 h-3.5" />
            Geri
          </Link>
        </div>
      </section>
      <ProgressCharts clientId={clientId} exercises={exercises} />
    </div>
  );
}

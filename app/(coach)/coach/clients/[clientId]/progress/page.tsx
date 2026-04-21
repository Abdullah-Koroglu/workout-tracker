import { ProgressCharts } from "@/components/coach/ProgressCharts";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";

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
        <section className="rounded-xl bg-gradient-to-br from-card via-muted/20 to-background p-6 shadow-sm ring-1 ring-black/5">
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-primary">Coach: Analytics Lab</p>
          <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-900">{client.name}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{client.email}</p>
        </section>
        <div className="rounded-xl bg-muted/40 p-8 text-center">
          <p className="text-muted-foreground">Henüz tamamlanan workout bulunamadı.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <section className="rounded-xl bg-gradient-to-br from-card via-muted/20 to-background p-6 shadow-sm ring-1 ring-black/5">
        <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-primary">Coach: Analytics Lab</p>
        <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-900">{client.name}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{client.email}</p>
      </section>
      <ProgressCharts clientId={clientId} exercises={exercises} />
    </div>
  );
}

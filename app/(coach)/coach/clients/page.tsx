import { CoachClientsManager } from "@/components/coach/CoachClientsManager";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function CoachClientsPage() {
  const session = await auth();
  const coachId = session?.user.id || "";

  const relations = await prisma.coachClientRelation.findMany({
    where: { coachId },
    include: { client: true },
    orderBy: { createdAt: "desc" }
  });

  const accepted = relations
    .filter((relation) => relation.status === "ACCEPTED")
    .map((relation) => ({
      id: relation.client.id,
      relationId: relation.id,
      name: relation.client.name,
      email: relation.client.email,
      status: relation.status
    }));
  const pending = relations
    .filter((relation) => relation.status === "PENDING")
    .map((relation) => ({
      id: relation.client.id,
      relationId: relation.id,
      name: relation.client.name,
      email: relation.client.email,
      status: relation.status
    }));

  return (
    <div className="space-y-6">
      <section className="rounded-xl bg-gradient-to-br from-card via-muted/30 to-background p-6 shadow-sm ring-1 ring-black/5">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Coach Portal</p>
        <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-900">Active Roster</h1>
        <p className="mt-1 text-sm text-muted-foreground">Danışan ilişkileri, bekleyen istekler ve ilerleme erişimi.</p>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <div className="rounded-lg bg-background px-4 py-3 shadow-sm ring-1 ring-black/5">
            <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Toplam</p>
            <p className="mt-1 text-2xl font-black text-primary">{relations.length}</p>
          </div>
          <div className="rounded-lg bg-background px-4 py-3 shadow-sm ring-1 ring-black/5">
            <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Kabul Edilen</p>
            <p className="mt-1 text-2xl font-black text-secondary">{accepted.length}</p>
          </div>
          <div className="rounded-lg bg-background px-4 py-3 shadow-sm ring-1 ring-black/5">
            <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Bekleyen</p>
            <p className="mt-1 text-2xl font-black text-foreground">{pending.length}</p>
          </div>
        </div>
      </section>

      <CoachClientsManager accepted={accepted} pending={pending} />
    </div>
  );
}

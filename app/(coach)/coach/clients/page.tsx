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
      <section className="rounded-3xl border border-sky-200/60 bg-gradient-to-br from-sky-50 via-white to-cyan-50 p-6 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-sky-700">Client Yönetimi</p>
        <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-900">Clientler</h1>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <div className="rounded-2xl bg-white px-4 py-3 shadow-sm">
            <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Toplam</p>
            <p className="mt-1 text-2xl font-black text-slate-900">{relations.length}</p>
          </div>
          <div className="rounded-2xl bg-white px-4 py-3 shadow-sm">
            <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Kabul Edilen</p>
            <p className="mt-1 text-2xl font-black text-slate-900">{accepted.length}</p>
          </div>
          <div className="rounded-2xl bg-white px-4 py-3 shadow-sm">
            <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Bekleyen</p>
            <p className="mt-1 text-2xl font-black text-slate-900">{pending.length}</p>
          </div>
        </div>
      </section>

      <CoachClientsManager accepted={accepted} pending={pending} />
    </div>
  );
}

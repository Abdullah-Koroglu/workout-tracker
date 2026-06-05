import { BroadcastModal } from "@/components/coach/BroadcastModal";
import { CoachClientsManager } from "@/components/coach/CoachClientsManager";
import { CoachReferralGrowthCard } from "@/components/coach/CoachReferralGrowthCard";
import { InviteLinkGenerator } from "@/components/coach/InviteLinkGenerator";
import { calculateComplianceScore } from "@/lib/analytics/compliance";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function CoachClientsPage() {
  const session = await auth();
  const coachId = session?.user.id || "";

  const [coachProfile, relations, referrals] = await Promise.all([
    prisma.coachProfile.findUnique({
      where: { userId: coachId },
      select: { inviteCode: true },
    }),
    prisma.coachClientRelation.findMany({
      where: { coachId },
      include: { client: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.referral.findMany({
      where: { referrerId: coachId },
      orderBy: { createdAt: "desc" },
      include: { referee: { select: { id: true, name: true } } },
    }),
  ]);

  const accepted = await Promise.all(
    relations
      .filter((relation) => relation.status === "ACCEPTED")
      .map(async (relation) => ({
        id: relation.client.id,
        relationId: relation.id,
        name: relation.client.name,
        email: relation.client.email,
        status: relation.status as "ACCEPTED",
        compliance: (await calculateComplianceScore(relation.client.id)) ?? undefined,
      })),
  );

  const pending = relations
    .filter((relation) => relation.status === "PENDING")
    .map((relation) => ({
      id: relation.client.id,
      relationId: relation.id,
      name: relation.client.name,
      email: relation.client.email,
      status: relation.status as "PENDING",
    }));

  return (
    <div className="flex min-w-0 flex-col gap-5 overflow-x-hidden pb-[calc(var(--app-mobile-nav-height)+2rem)] md:pb-10">
      <section className="rounded-[24px] border border-slate-200 bg-white px-5 py-5 shadow-sm md:px-6 md:py-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="max-w-3xl">
            <div className="mb-2 inline-flex rounded-full bg-orange-50 px-3 py-1 text-[11px] font-black uppercase tracking-[0.18em] text-orange-600">
              Coach CRM
            </div>
            <h1 className="text-[26px] font-black tracking-[-0.04em] text-slate-900 md:text-[30px]">
              Danisanlarini tek yerden yonet
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
              Aktif danisanlar, bekleyen talepler, davet akisi ve ilerleme erisimi burada toplanir.
            </p>
          </div>

          {accepted.length > 0 ? (
            <div className="flex w-full md:w-auto">
              <BroadcastModal clients={accepted.map((client) => ({ id: client.id, name: client.name }))} />
            </div>
          ) : null}
        </div>
      </section>

      <div className="grid min-w-0 gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(300px,360px)]">
        <div className="min-w-0 space-y-4">
          {coachProfile?.inviteCode ? <InviteLinkGenerator inviteCode={coachProfile.inviteCode} /> : null}
          <CoachClientsManager accepted={accepted} pending={pending} />
        </div>

        <div className="min-w-0 space-y-4">
          <CoachReferralGrowthCard
            initialReferrals={referrals.map((item) => ({
              id: item.id,
              code: item.code,
              status: item.status,
              createdAt: item.createdAt.toISOString(),
              referee: item.referee ? { id: item.referee.id, name: item.referee.name } : null,
            }))}
          />
        </div>
      </div>
    </div>
  );
}

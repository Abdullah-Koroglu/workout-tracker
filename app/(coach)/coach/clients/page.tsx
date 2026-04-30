import { CoachClientsManager } from "@/components/coach/CoachClientsManager";
import { InviteLinkGenerator } from "@/components/coach/InviteLinkGenerator";
import { BroadcastModal } from "@/components/coach/BroadcastModal";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { calculateComplianceScore } from "@/lib/analytics/compliance";

export default async function CoachClientsPage() {
  const session = await auth();
  const coachId = session?.user.id || "";

  const [coachProfile, relations] = await Promise.all([
    prisma.coachProfile.findUnique({
      where: { userId: coachId },
      select: { inviteCode: true },
    }),
    prisma.coachClientRelation.findMany({
      where: { coachId },
      include: { client: true },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const accepted = await Promise.all(
    relations
      .filter((r) => r.status === "ACCEPTED")
      .map(async (r) => ({
        id: r.client.id,
        relationId: r.id,
        name: r.client.name,
        email: r.client.email,
        status: r.status as "ACCEPTED",
        compliance: (await calculateComplianceScore(r.client.id)) ?? undefined,
      }))
  );

  const pending = relations
    .filter((r) => r.status === "PENDING")
    .map((r) => ({
      id: r.client.id,
      relationId: r.id,
      name: r.client.name,
      email: r.client.email,
      status: r.status as "PENDING",
    }));

  return (
    <div className="flex flex-col gap-3.5">
      {/* Page Title */}
      <div className="flex items-start justify-between px-1">
        <div>
          <h1 className="text-[22px] font-black tracking-tight" style={{ color: "#1E293B" }}>
            Danışanlar
          </h1>
          <p className="text-sm mt-0.5" style={{ color: "#94A3B8" }}>
            Danışan ilişkileri, bekleyen istekler ve ilerleme erişimi.
          </p>
        </div>
        {accepted.length > 0 && (
          <BroadcastModal clients={accepted.map((c) => ({ id: c.id, name: c.name }))} />
        )}
      </div>

      {coachProfile?.inviteCode && (
        <InviteLinkGenerator inviteCode={coachProfile.inviteCode} />
      )}

      <CoachClientsManager accepted={accepted} pending={pending} />
    </div>
  );
}

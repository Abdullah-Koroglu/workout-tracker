import { CoachClientsManager } from "@/components/coach/CoachClientsManager";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function CoachClientsPage() {
  const session = await auth();
  const coachId = session?.user.id || "";

  const relations = await prisma.coachClientRelation.findMany({
    where: { coachId },
    include: { client: true },
    orderBy: { createdAt: "desc" },
  });

  const accepted = relations
    .filter((r) => r.status === "ACCEPTED")
    .map((r) => ({
      id: r.client.id,
      relationId: r.id,
      name: r.client.name,
      email: r.client.email,
      status: r.status as "ACCEPTED",
    }));

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
      <div className="px-1">
        <h1 className="text-[22px] font-black tracking-tight" style={{ color: "#1E293B" }}>
          Danışanlar
        </h1>
        <p className="text-sm mt-0.5" style={{ color: "#94A3B8" }}>
          Danışan ilişkileri, bekleyen istekler ve ilerleme erişimi.
        </p>
      </div>

      <CoachClientsManager accepted={accepted} pending={pending} />
    </div>
  );
}

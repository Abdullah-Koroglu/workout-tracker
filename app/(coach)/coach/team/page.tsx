import Link from "next/link";
import { Building2, CheckCircle2, ShieldCheck, Users, Wallet } from "lucide-react";

import { auth } from "@/lib/auth";
import { getAgencyWorkspaceSummaryForCoach } from "@/lib/agency-workspace";
import { prisma } from "@/lib/prisma";

const ROLE_LABEL: Record<string, string> = {
  OWNER: "Owner",
  ADMIN: "Admin",
  COACH: "Coach",
  STAFF: "Staff",
};

const STATUS_LABEL: Record<string, string> = {
  ACTIVE: "Active",
  INVITED: "Invited",
  DISABLED: "Disabled",
};

const PERMISSION_LABELS = [
  {
    title: "Owner / Admin",
    description: "Billing, seats, coach invites, workspace policy, and shared reporting.",
  },
  {
    title: "Coach",
    description: "Own roster, shared clients, templates, sessions, and coach-client notes.",
  },
  {
    title: "Staff",
    description: "Operations support, scheduling visibility, and basic CRM-style follow-up access.",
  },
];

function formatDate(date: Date | null) {
  if (!date) return "-";

  return new Intl.DateTimeFormat("tr-TR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

export default async function CoachTeamPage() {
  const session = await auth();
  const coachId = session?.user.id ?? "";

  const [coachProfile, workspaceSummary] = await Promise.all([
    prisma.coachProfile.findUnique({
      where: { userId: coachId },
      select: { subscriptionTier: true },
    }),
    getAgencyWorkspaceSummaryForCoach(coachId),
  ]);

  const tier = coachProfile?.subscriptionTier ?? "FREE";

  if (!workspaceSummary) {
    return (
      <div className="flex flex-col gap-5">
        <div className="rounded-[24px] border border-slate-200 bg-white px-6 py-6 shadow-sm">
          <div className="flex items-start justify-between gap-6">
            <div className="max-w-3xl">
              <div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.22em] text-violet-600">
                <Building2 className="h-4 w-4" />
                Agency / Gym Workspace
              </div>
              <h1 className="text-[28px] font-black tracking-[-0.04em] text-slate-900">Coklu koc yapisi hazir</h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
                FitCoach artik owner, coach, staff ve shared client mantigini tasiyacak tenant modeline sahip. Bu sayfa
                bagimsiz koctan ekip operasyonuna gecis anini yonetmek icin hazirlandi.
              </p>
            </div>
            <div className="rounded-2xl bg-violet-50 px-4 py-3 text-right">
              <div className="text-[11px] font-bold uppercase tracking-[0.22em] text-violet-500">Plan Durumu</div>
              <div className="mt-1 text-lg font-black text-violet-900">{tier === "AGENCY" ? "Agency" : "Upgrade gerekli"}</div>
            </div>
          </div>
        </div>

        <section className="grid gap-4 lg:grid-cols-3">
          {[
            {
              icon: Users,
              title: "Roles and seats",
              body: "Owner, admin, coach ve staff rolleri; aktif koltuk ve davet sayisi ile yonetilir.",
            },
            {
              icon: ShieldCheck,
              title: "Shared clients",
              body: "Danisan birincil kocta kalirken workspace icinde diger ekip uyeleri tarafindan da gorulebilir.",
            },
            {
              icon: Wallet,
              title: "Central billing",
              body: "Agency plani tek fatura, ekip kapasitesi ve gym/ajans onboarding akisini aciyor.",
            },
          ].map((item) => {
            const Icon = item.icon;

            return (
              <div key={item.title} className="rounded-[22px] border border-slate-200 bg-white px-5 py-5 shadow-sm">
                <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-2xl bg-violet-50 text-violet-600">
                  <Icon className="h-5 w-5" />
                </div>
                <div className="text-base font-black text-slate-900">{item.title}</div>
                <p className="mt-2 text-sm leading-6 text-slate-600">{item.body}</p>
              </div>
            );
          })}
        </section>

        <section className="rounded-[22px] border border-slate-200 bg-white px-6 py-5 shadow-sm">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-lg font-black tracking-[-0.03em] text-slate-900">Ilk tenant kurulumu icin sonraki adim</h2>
              <p className="mt-1 text-sm text-slate-500">
                Agency planina gecince ekip alanini, koltuklari ve paylasilan danisan yapisini aktiflestirebiliriz.
              </p>
            </div>
            <div className="flex gap-3">
              <Link
                href="/coach/billing"
                className="inline-flex items-center justify-center rounded-xl bg-violet-600 px-4 py-2 text-sm font-black text-white transition hover:bg-violet-700"
              >
                Agency planini incele
              </Link>
              <Link
                href="mailto:hello@fitcoach.local?subject=Agency%20Workspace"
                className="inline-flex items-center justify-center rounded-xl border border-slate-200 px-4 py-2 text-sm font-bold text-slate-700 transition hover:border-violet-200 hover:text-violet-700"
              >
                Kurulum iste
              </Link>
            </div>
          </div>
        </section>
      </div>
    );
  }

  const { workspace, membership } = workspaceSummary;

  return (
    <div className="flex flex-col gap-5">
      <section className="rounded-[24px] border border-slate-200 bg-white px-6 py-6 shadow-sm">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.22em] text-violet-600">
              <Building2 className="h-4 w-4" />
              {workspace.isGym ? "Gym Workspace" : "Agency Workspace"}
            </div>
            <h1 className="text-[28px] font-black tracking-[-0.04em] text-slate-900">{workspace.name}</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
              Owner, coach ve staff rollerini ayni tenant altinda toplar. Shared client ve merkezi raporlama akisi bu
              workspace uzerinden ilerler.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              {[
                workspace.city ? `Sehir: ${workspace.city}` : null,
                `Rolun: ${ROLE_LABEL[membership.role] ?? membership.role}`,
                `Durum: ${STATUS_LABEL[membership.status] ?? membership.status}`,
                `Slug: ${workspace.slug}`,
              ]
                .filter(Boolean)
                .map((item) => (
                  <span key={item} className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">
                    {item}
                  </span>
                ))}
            </div>
          </div>

          <div className="grid w-full grid-cols-2 gap-3 sm:max-w-[320px]">
            {[
              { label: "Seats", value: `${workspace.metrics.seatsUsed}/${workspace.seatsIncluded}` },
              { label: "Active coaches", value: String(workspace.metrics.activeCoaches) },
              { label: "Shared clients", value: String(workspace.metrics.sharedClientCount) },
              { label: "Unassigned", value: String(workspace.metrics.unassignedSharedClients) },
            ].map((stat) => (
              <div key={stat.label} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
                <div className="text-[11px] font-bold uppercase tracking-[0.22em] text-slate-400">{stat.label}</div>
                <div className="mt-2 text-2xl font-black tracking-[-0.04em] text-slate-900">{stat.value}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="grid gap-5 xl:grid-cols-[1.3fr_0.7fr]">
        <div className="rounded-[22px] border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 px-6 py-4">
            <h2 className="text-lg font-black tracking-[-0.03em] text-slate-900">Ekip uyeleri</h2>
            <p className="mt-1 text-sm text-slate-500">Agency tenant icindeki roller, koltuk kullanimi ve danisan yukleri.</p>
          </div>
          <div className="divide-y divide-slate-100">
            {workspace.members.map((item) => (
              <div key={item.id} className="flex flex-col gap-3 px-6 py-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <div className="text-sm font-black text-slate-900">{item.user.name}</div>
                  <div className="mt-1 text-xs text-slate-500">{item.user.email}</div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-violet-50 px-3 py-1 text-xs font-bold text-violet-700">
                    {ROLE_LABEL[item.role] ?? item.role}
                  </span>
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">
                    {STATUS_LABEL[item.status] ?? item.status}
                  </span>
                  <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">
                    {item.acceptedClientCount} active client
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-[22px] border border-slate-200 bg-white px-6 py-5 shadow-sm">
          <h2 className="text-lg font-black tracking-[-0.03em] text-slate-900">Permission modeli</h2>
          <div className="mt-4 space-y-3">
            {PERMISSION_LABELS.map((item) => (
              <div key={item.title} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
                <div className="flex items-center gap-2 text-sm font-black text-slate-900">
                  <CheckCircle2 className="h-4 w-4 text-violet-600" />
                  {item.title}
                </div>
                <p className="mt-2 text-sm leading-6 text-slate-600">{item.description}</p>
              </div>
            ))}
          </div>

          <div className="mt-5 rounded-2xl border border-violet-100 bg-violet-50 px-4 py-4">
            <div className="text-xs font-bold uppercase tracking-[0.22em] text-violet-500">Central billing</div>
            <div className="mt-2 text-sm font-semibold text-violet-900">{workspace.billingEmail ?? "Billing email tanimsiz"}</div>
            <div className="mt-1 text-xs text-violet-700">Workspace kurulum tarihi: {formatDate(workspace.createdAt)}</div>
          </div>
        </div>
      </section>

      <section className="rounded-[22px] border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 px-6 py-4">
          <h2 className="text-lg font-black tracking-[-0.03em] text-slate-900">Shared client roster</h2>
          <p className="mt-1 text-sm text-slate-500">Birincil koc ve ekip gorunurlugu artik tenant seviyesinde izleniyor.</p>
        </div>

        <div className="space-y-3 p-4 md:hidden">
          {workspace.sharedClients.map((item) => (
            <div key={item.id} className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-sm font-black text-slate-900">{item.client.name}</div>
                  <div className="mt-1 text-xs text-slate-500">{item.client.email}</div>
                </div>
                <span className="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-bold text-slate-600">{item.visibility}</span>
              </div>
              <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
                <div className="rounded-xl bg-white px-3 py-2 ring-1 ring-slate-200/80">
                  <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">Primary coach</div>
                  <div className="mt-1 text-sm font-semibold text-slate-800">{item.primaryCoach?.name ?? "Atanmadi"}</div>
                </div>
                <div className="rounded-xl bg-white px-3 py-2 ring-1 ring-slate-200/80">
                  <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">Added</div>
                  <div className="mt-1 text-sm font-semibold text-slate-800">{formatDate(item.createdAt)}</div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="hidden overflow-x-auto md:block">
          <table className="min-w-full border-collapse">
            <thead className="bg-slate-50">
              <tr>
                {["Client", "Primary coach", "Visibility", "Added"].map((header) => (
                  <th key={header} className="px-6 py-3 text-left text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400">
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {workspace.sharedClients.map((item) => (
                <tr key={item.id} className="border-t border-slate-100">
                  <td className="px-6 py-4">
                    <div className="text-sm font-black text-slate-900">{item.client.name}</div>
                    <div className="mt-1 text-xs text-slate-500">{item.client.email}</div>
                  </td>
                  <td className="px-6 py-4 text-sm font-semibold text-slate-700">{item.primaryCoach?.name ?? "Atanmadi"}</td>
                  <td className="px-6 py-4">
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">{item.visibility}</span>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-500">{formatDate(item.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

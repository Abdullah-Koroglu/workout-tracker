import Link from "next/link";
import type { ComponentType } from "react";
import {
  AlertTriangle,
  CalendarClock,
  CheckCircle2,
  ClipboardList,
  MessageCircle,
  UserPlus,
} from "lucide-react";

type ActionItem = {
  label: string;
  meta?: string;
  href?: string;
};

type ActionBlock = {
  id: string;
  title: string;
  description: string;
  count: number;
  href: string;
  ctaLabel: string;
  emptyLabel: string;
  icon: ComponentType<{ className?: string }>;
  tone: "critical" | "warm" | "calm" | "success";
  items: ActionItem[];
};

type Props = {
  onboarding: {
    completed: number;
    remaining: number;
    total: number;
  };
  pendingRequests: {
    count: number;
    items: ActionItem[];
  };
  riskClients: {
    count: number;
    items: ActionItem[];
  };
  unansweredCheckIns: {
    count: number;
    items: ActionItem[];
  };
  unreadMessages: {
    count: number;
    items: ActionItem[];
  };
  upcomingSessions: {
    count: number;
    items: ActionItem[];
  };
};

const TONE_STYLES = {
  critical: {
    shell: "border-red-100 bg-red-50/70",
    icon: "bg-red-100 text-red-600",
    badge: "bg-red-100 text-red-700",
    link: "text-red-600",
  },
  warm: {
    shell: "border-orange-100 bg-orange-50/70",
    icon: "bg-orange-100 text-orange-600",
    badge: "bg-orange-100 text-orange-700",
    link: "text-orange-600",
  },
  calm: {
    shell: "border-sky-100 bg-sky-50/70",
    icon: "bg-sky-100 text-sky-700",
    badge: "bg-sky-100 text-sky-700",
    link: "text-sky-700",
  },
  success: {
    shell: "border-emerald-100 bg-emerald-50/80",
    icon: "bg-emerald-100 text-emerald-700",
    badge: "bg-emerald-100 text-emerald-700",
    link: "text-emerald-700",
  },
} as const;

function ActionCard({ block }: { block: ActionBlock }) {
  const tone = TONE_STYLES[block.tone];
  const Icon = block.icon;

  return (
    <section
      className={`rounded-[18px] border p-4 shadow-sm ${tone.shell}`}
      data-action-block={block.id}
    >
      <div className="mb-3 flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl ${tone.icon}`}>
            <Icon className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[14px] font-black text-slate-800">{block.title}</p>
            <p className="mt-1 text-[11px] leading-relaxed text-slate-500">{block.description}</p>
          </div>
        </div>
        <span className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-black ${tone.badge}`}>
          {block.count}
        </span>
      </div>

      {block.items.length > 0 ? (
        <div className="space-y-2">
          {block.items.map((item) => {
            const body = (
              <>
                <span className="truncate text-[12px] font-bold text-slate-700">{item.label}</span>
                {item.meta ? (
                  <span className="mt-0.5 truncate text-[11px] text-slate-500">{item.meta}</span>
                ) : null}
              </>
            );

            return item.href ? (
              <Link
                key={`${block.id}-${item.label}`}
                href={item.href}
                className="flex flex-col rounded-xl bg-white/80 px-3 py-2.5 transition hover:bg-white"
              >
                {body}
              </Link>
            ) : (
              <div
                key={`${block.id}-${item.label}`}
                className="flex flex-col rounded-xl bg-white/80 px-3 py-2.5"
              >
                {body}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="rounded-xl bg-white/80 px-3 py-3 text-[12px] font-semibold text-slate-500">
          {block.emptyLabel}
        </div>
      )}

      <Link
        href={block.href}
        className={`mt-3 inline-flex text-[12px] font-black ${tone.link} transition-opacity hover:opacity-80`}
      >
        {block.ctaLabel}
      </Link>
    </section>
  );
}

export function CoachActionCenter({
  onboarding,
  pendingRequests,
  riskClients,
  unansweredCheckIns,
  unreadMessages,
  upcomingSessions,
}: Props) {
  const blocks: ActionBlock[] = [
    {
      id: "pending-requests",
      title: "Bekleyen talepler",
      description: "Marketplace veya davet akışından gelen yeni danışan istekleri.",
      count: pendingRequests.count,
      href: "/coach/clients",
      ctaLabel: "Talepleri yönet",
      emptyLabel: "Şu an bekleyen yeni istek yok.",
      icon: UserPlus,
      tone: pendingRequests.count > 0 ? "warm" : "success",
      items: pendingRequests.items,
    },
    {
      id: "risk-clients",
      title: "Riskli danışanlar",
      description: "Devamlılık veya tamamlama riski taşıyan danışanlar.",
      count: riskClients.count,
      href: "/coach/clients",
      ctaLabel: "Riskli danışanları aç",
      emptyLabel: "Risk listesinde öne çıkan danışan görünmüyor.",
      icon: AlertTriangle,
      tone: riskClients.count > 0 ? "critical" : "success",
      items: riskClients.items,
    },
    {
      id: "check-ins",
      title: "Cevapsız check-in'ler",
      description: "Yanıt bekleyen check-in'ler koçun takip ritmini belirler.",
      count: unansweredCheckIns.count,
      href: "/coach/dashboard#coach-checkins",
      ctaLabel: "Check-in bölümüne git",
      emptyLabel: "Şu an yanıt bekleyen check-in yok.",
      icon: ClipboardList,
      tone: unansweredCheckIns.count > 0 ? "warm" : "success",
      items: unansweredCheckIns.items,
    },
    {
      id: "messages",
      title: "Okunmamış mesajlar",
      description: "Mesaj kutusunda hızlı cevap bekleyen konuşmalar.",
      count: unreadMessages.count,
      href: "/coach/messages",
      ctaLabel: "Mesaj kutusunu aç",
      emptyLabel: "Mesaj kutusunda okunmamış konuşma yok.",
      icon: MessageCircle,
      tone: unreadMessages.count > 0 ? "critical" : "success",
      items: unreadMessages.items,
    },
    {
      id: "sessions",
      title: "Yaklaşan seanslar",
      description: "Sıradaki planlı seanslar ve hazırlanman gereken görüşmeler.",
      count: upcomingSessions.count,
      href: "/coach/dashboard#coach-sessions",
      ctaLabel: "Seans planını incele",
      emptyLabel: "Takvimde yaklaşan planlı seans görünmüyor.",
      icon: CalendarClock,
      tone: upcomingSessions.count > 0 ? "calm" : "success",
      items: upcomingSessions.items,
    },
  ];

  return (
    <section className="space-y-4">
      <div className="rounded-[18px] border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-[15px] font-black text-slate-800">Bugünün aksiyon merkezi</p>
            <p className="mt-1 max-w-2xl text-[12px] leading-relaxed text-slate-500">
              Koç panelindeki dağınık sinyalleri tek yerde topla: yeni talepler, riskler, yanıt bekleyen akışlar ve yaklaşan seanslar.
            </p>
          </div>
          <Link
            href="/coach/dashboard#onboarding-checklist"
            className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-3 py-2 text-[11px] font-black text-white transition hover:bg-slate-800"
          >
            <CheckCircle2 className="h-3.5 w-3.5" />
            Onboarding {onboarding.completed}/{onboarding.total}
          </Link>
        </div>

        <div className="mt-4 grid gap-2 md:grid-cols-3 xl:grid-cols-6">
          {[
            { label: "Eksik onboarding", value: onboarding.remaining, tone: "text-slate-800" },
            { label: "Yeni talepler", value: pendingRequests.count, tone: "text-orange-600" },
            { label: "Riskli danışan", value: riskClients.count, tone: "text-red-600" },
            { label: "Cevapsız check-in", value: unansweredCheckIns.count, tone: "text-amber-600" },
            { label: "Okunmamış mesaj", value: unreadMessages.count, tone: "text-indigo-600" },
            { label: "Yaklaşan seans", value: upcomingSessions.count, tone: "text-sky-700" },
          ].map((stat) => (
            <div key={stat.label} className="rounded-2xl border border-slate-100 bg-slate-50 px-3 py-3">
              <p className={`text-[20px] font-black leading-none ${stat.tone}`}>{stat.value}</p>
              <p className="mt-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                {stat.label}
              </p>
            </div>
          ))}
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        {blocks.map((block) => (
          <ActionCard key={block.id} block={block} />
        ))}
      </div>
    </section>
  );
}

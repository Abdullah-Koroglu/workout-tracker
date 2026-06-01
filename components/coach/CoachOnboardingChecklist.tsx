import Link from "next/link";
import type { ComponentType } from "react";
import {
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  ClipboardList,
  Dumbbell,
  Image as ImageIcon,
  Link2,
  PackagePlus,
  UserRound,
  Users,
} from "lucide-react";

type ChecklistItem = {
  id: string;
  label: string;
  description: string;
  href: string;
  done: boolean;
  icon: ComponentType<{ className?: string }>;
};

type Props = {
  profileReady: boolean;
  packageReady: boolean;
  availabilityReady: boolean;
  templateReady: boolean;
  inviteReady: boolean;
  transformationReady: boolean;
  clientReady: boolean;
};

export function CoachOnboardingChecklist({
  profileReady,
  packageReady,
  availabilityReady,
  templateReady,
  inviteReady,
  transformationReady,
  clientReady,
}: Props) {
  const items: ChecklistItem[] = [
    {
      id: "profile",
      label: "Vitrin profilini tamamla",
      description: "Bio, uzmanlık, şehir ve deneyim alanları marketplace güvenini artırır.",
      href: "/coach/profile",
      done: profileReady,
      icon: UserRound,
    },
    {
      id: "package",
      label: "İlk koçluk paketini oluştur",
      description: "Danışanların ne satın alacağını net görmesi için en az bir aktif paket ekle.",
      href: "/coach/profile",
      done: packageReady,
      icon: PackagePlus,
    },
    {
      id: "availability",
      label: "Uygunluk saatlerini belirle",
      description: "Seans rezervasyonu ve ilk görüşme akışı için haftalık zamanlarını tanımla.",
      href: "/coach/profile",
      done: availabilityReady,
      icon: CalendarDays,
    },
    {
      id: "template",
      label: "İlk antrenman şablonunu hazırla",
      description: "Danışan kabul ettiğinde hızlıca program atayabilmek için başlangıç şablonu oluştur.",
      href: "/coach/templates",
      done: templateReady,
      icon: Dumbbell,
    },
    {
      id: "invite",
      label: "Davet linkini hazırla",
      description: "Mevcut danışanlarını platforma taşımak için kişisel davet linkini kullan.",
      href: "/coach/profile",
      done: inviteReady,
      icon: Link2,
    },
    {
      id: "transformation",
      label: "Dönüşüm vitrini ekle",
      description: "Önce/sonra görselleri ve başarı örnekleri açık marketplace’te karar verdirir.",
      href: "/coach/profile",
      done: transformationReady,
      icon: ImageIcon,
    },
    {
      id: "client",
      label: "İlk danışanı bağla",
      description: "Kurulumun gerçek değer üretmesi için ilk danışanı davet et veya bekleyen isteği kabul et.",
      href: "/coach/clients",
      done: clientReady,
      icon: Users,
    },
  ];

  const completed = items.filter((item) => item.done).length;
  const total = items.length;
  const pct = Math.round((completed / total) * 100);
  const nextItem = items.find((item) => !item.done);
  const NextIcon = nextItem?.icon;

  if (completed === total) {
    return (
      <section className="rounded-[18px] border border-emerald-100 bg-emerald-50 p-4 shadow-sm">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-emerald-100">
            <CheckCircle2 className="h-5 w-5 text-emerald-600" />
          </div>
          <div>
            <p className="text-[15px] font-black text-emerald-950">Koç vitrinin hazır</p>
            <p className="mt-1 text-xs leading-relaxed text-emerald-700">
              Bağımsız koç MVP kurulumunu tamamladın. Sıradaki en değerli aksiyon: marketplace profilini güçlendirmek ve yeni danışan taleplerini takip etmek.
            </p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="rounded-[18px] border border-orange-100 bg-white p-4 shadow-sm">
      <div className="mb-4 flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-orange-50">
            <ClipboardList className="h-5 w-5 text-orange-500" />
          </div>
          <div>
            <p className="text-[15px] font-black text-slate-800">Koç kurulum checklist’i</p>
            <p className="mt-1 text-xs leading-relaxed text-slate-500">
              Ödeme yapacak bağımsız koç deneyiminin temeli: profil, paket, program ve ilk danışan.
            </p>
          </div>
        </div>
        <div className="shrink-0 text-right">
          <p className="text-2xl font-black text-orange-500">%{pct}</p>
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            {completed}/{total}
          </p>
        </div>
      </div>

      <div className="mb-4 h-2 overflow-hidden rounded-full bg-slate-100">
        <div
          className="h-full rounded-full bg-gradient-to-r from-orange-400 to-orange-600 transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>

      {nextItem ? (
        <Link
          href={nextItem.href}
          className="mb-3 flex items-center justify-between gap-3 rounded-2xl bg-orange-50 p-3 transition hover:bg-orange-100"
        >
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white">
              {NextIcon ? <NextIcon className="h-4 w-4 text-orange-500" /> : null}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-black text-slate-800">Sıradaki adım: {nextItem.label}</p>
              <p className="mt-0.5 line-clamp-2 text-[11px] leading-relaxed text-slate-500">
                {nextItem.description}
              </p>
            </div>
          </div>
          <ChevronRight className="h-4 w-4 shrink-0 text-orange-500" />
        </Link>
      ) : null}

      <div className="grid gap-2 md:grid-cols-2">
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.id}
              href={item.href}
              className="flex items-center gap-2 rounded-xl border border-slate-100 bg-slate-50 px-3 py-2.5 transition hover:border-orange-200 hover:bg-orange-50"
            >
              <span
                className={[
                  "flex h-6 w-6 shrink-0 items-center justify-center rounded-full",
                  item.done ? "bg-emerald-100 text-emerald-600" : "bg-white text-slate-400",
                ].join(" ")}
              >
                {item.done ? <CheckCircle2 className="h-4 w-4" /> : <Icon className="h-3.5 w-3.5" />}
              </span>
              <span
                className={[
                  "truncate text-xs font-bold",
                  item.done ? "text-slate-500 line-through decoration-slate-300" : "text-slate-700",
                ].join(" ")}
              >
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </section>
  );
}

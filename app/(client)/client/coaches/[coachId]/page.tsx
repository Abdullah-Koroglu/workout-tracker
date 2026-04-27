import Link from "next/link";
import { notFound } from "next/navigation";
import {
  Award,
  Briefcase,
  ChevronLeft,
  ExternalLink,
  MessageCircle,
  Star,
  Tag,
  Users,
} from "lucide-react";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { PageHero } from "@/components/shared/PageHero";
import { RequestCoachButton } from "./RequestCoachButton";

function getInitials(name: string) {
  return name
    .split(" ")
    .map((p) => p[0] ?? "")
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export default async function CoachVitrinPage({
  params,
}: {
  params: Promise<{ coachId: string }>;
}) {
  const session = await auth();
  if (!session || session.user.role !== "CLIENT") return null;

  const { coachId } = await params;

  const coach = await prisma.user.findUnique({
    where: { id: coachId, role: "COACH" },
    select: {
      id: true,
      name: true,
      coachProfile: {
        select: {
          bio: true,
          specialties: true,
          experienceYears: true,
          socialMediaUrl: true,
          packages: {
            where: { isActive: true },
            orderBy: { createdAt: "asc" },
          },
        },
      },
      coachRelations: {
        where: { clientId: session.user.id },
        select: { status: true },
        take: 1,
      },
    },
  });

  if (!coach) return notFound();

  const profile       = coach.coachProfile;
  const specialties   = Array.isArray(profile?.specialties) ? (profile.specialties as string[]) : [];
  const relationStatus = coach.coachRelations[0]?.status ?? null;
  const messageHref   = `/client/messages?withUserId=${coachId}`;
  const pkgCount      = profile?.packages.length ?? 0;

  return (
    <div className="space-y-6 pb-16">

      {/* ── Back link ── */}
      <Link
        href="/client/coaches"
        className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-400 transition-colors hover:text-slate-700"
      >
        <ChevronLeft className="h-3.5 w-3.5" />
        Koç Bul
      </Link>

      {/* ── Hero banner ── */}
      <PageHero
        eyebrow="Elite Coach"
        title={coach.name}
        subtitle={profile?.experienceYears != null ? `${profile.experienceYears} yıl tecrübe` : undefined}
        variant="navy"
        avatar={{ initials: getInitials(coach.name), variant: "navy" }}
        statBoxes={[
          { label: "Deneyim",  value: profile?.experienceYears ? `${profile.experienceYears} yıl` : "—", icon: Star },
          { label: "Uzmanlık", value: `${specialties.length}`, icon: Award },
          { label: "Paket",    value: `${pkgCount}`, icon: Briefcase },
        ]}
      >
        {/* Bio */}
        {profile?.bio && (
          <p className="text-sm leading-relaxed text-slate-300 max-w-2xl">{profile.bio}</p>
        )}
        {/* Social link */}
        {profile?.socialMediaUrl && (
          <a
            href={profile.socialMediaUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-2 inline-flex items-center gap-1 text-xs font-bold text-orange-400 hover:text-orange-300 transition-colors"
          >
            <ExternalLink className="h-3 w-3" />
            Sosyal Medya
          </a>
        )}
        {/* Specialties */}
        {specialties.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {specialties.map((s) => (
              <span
                key={s}
                className="rounded-full px-3 py-1 text-xs font-bold"
                style={{ background: "rgba(249,115,22,0.15)", color: "#FB923C", border: "1px solid rgba(249,115,22,0.2)" }}
              >
                {s}
              </span>
            ))}
          </div>
        )}
      </PageHero>

      {/* ── Desktop 2-col layout ── */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">

        {/* ── LEFT: Packages ── */}
        <div className="xl:col-span-2 space-y-4">
          <div className="flex items-center gap-2">
            <div
              className="flex h-8 w-8 items-center justify-center rounded-xl"
              style={{ background: "rgba(249,115,22,0.1)" }}
            >
              <Briefcase className="h-4 w-4 text-orange-500" />
            </div>
            <h2 className="text-base font-black text-slate-800">Eğitim Paketleri</h2>
            {pkgCount > 0 && (
              <span
                className="rounded-full px-2.5 py-0.5 text-xs font-black"
                style={{ background: "rgba(249,115,22,0.1)", color: "#EA580C" }}
              >
                {pkgCount}
              </span>
            )}
          </div>

          {pkgCount === 0 ? (
            <div
              className="rounded-2xl bg-white p-8 text-center"
              style={{ boxShadow: "0 2px 16px rgba(0,0,0,0.06), 0 1px 3px rgba(0,0,0,0.04)" }}
            >
              <div
                className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl"
                style={{ background: "rgba(249,115,22,0.08)" }}
              >
                <Briefcase className="h-7 w-7 text-orange-200" />
              </div>
              <p className="font-bold text-slate-600">Henüz paket bilgisi yok</p>
              <p className="mt-1 text-sm text-slate-400">Fiyat ve detaylar için mesaj gönderebilirsiniz.</p>
              <Link
                href={messageHref}
                className="mt-4 inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-black text-white transition-opacity hover:opacity-90"
                style={{
                  background: "linear-gradient(135deg, #FB923C, #EA580C)",
                  boxShadow: "0 4px 12px rgba(249,115,22,0.35)",
                }}
              >
                <MessageCircle className="h-4 w-4" />
                Fiyat Sor / İletişime Geç
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {profile!.packages.map((pkg) => (
                <div
                  key={pkg.id}
                  className="flex flex-col rounded-2xl bg-white overflow-hidden"
                  style={{ boxShadow: "0 2px 16px rgba(0,0,0,0.06), 0 1px 3px rgba(0,0,0,0.04)" }}
                >
                  {/* top accent */}
                  <div
                    className="h-1 w-full"
                    style={{ background: "linear-gradient(90deg, #FB923C, #EA580C)" }}
                  />
                  <div className="flex flex-1 flex-col p-5">
                    <div className="mb-3 flex items-start gap-3">
                      <div
                        className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl"
                        style={{ background: "rgba(249,115,22,0.1)" }}
                      >
                        <Briefcase className="h-4 w-4 text-orange-500" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-black text-slate-800">{pkg.title}</p>
                        {pkg.description && (
                          <p className="mt-1 text-xs text-slate-400 leading-relaxed line-clamp-3">
                            {pkg.description}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="mt-auto flex items-center justify-between gap-3 border-t border-slate-100 pt-3">
                      {pkg.price != null ? (
                        <span
                          className="rounded-full px-3 py-1 text-sm font-black"
                          style={{ background: "rgba(34,197,94,0.1)", color: "#16A34A" }}
                        >
                          {pkg.price.toLocaleString("tr-TR")} ₺
                        </span>
                      ) : (
                        <span className="text-xs font-semibold text-slate-400">Fiyat belirtilmemiş</span>
                      )}
                      <Link
                        href={messageHref}
                        className="flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-black text-white transition-opacity hover:opacity-90"
                        style={{
                          background: "linear-gradient(135deg, #1A365D, #2D4A7A)",
                          boxShadow: "0 3px 8px rgba(26,54,93,0.3)",
                        }}
                      >
                        <MessageCircle className="h-3.5 w-3.5" />
                        {pkg.price != null ? "İletişime Geç" : "Fiyat Sor"}
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── RIGHT: CTA sidebar ── */}
        <div className="space-y-4">

          {/* Request / status card */}
          <div
            className="rounded-2xl bg-white p-5 space-y-4"
            style={{ boxShadow: "0 2px 16px rgba(0,0,0,0.06), 0 1px 3px rgba(0,0,0,0.04)" }}
          >
            <h3 className="text-[11px] font-black uppercase tracking-widest text-slate-400">
              Bağlantı
            </h3>
            <RequestCoachButton coachId={coachId} initialStatus={relationStatus} />
          </div>

          {/* Message card */}
          <div
            className="rounded-2xl bg-white p-5 space-y-4"
            style={{ boxShadow: "0 2px 16px rgba(0,0,0,0.06), 0 1px 3px rgba(0,0,0,0.04)" }}
          >
            <h3 className="text-[11px] font-black uppercase tracking-widest text-slate-400">
              İletişim
            </h3>
            <Link
              href={messageHref}
              className="flex w-full items-center justify-center gap-2 rounded-2xl py-3.5 text-sm font-black uppercase tracking-wider text-white transition-opacity hover:opacity-90"
              style={{
                background: "linear-gradient(135deg, #1A365D, #2D4A7A)",
                boxShadow: "0 4px 14px rgba(26,54,93,0.35)",
              }}
            >
              <MessageCircle className="h-4 w-4" />
              Mesaj Gönder
            </Link>
          </div>

          {/* Specialties recap */}
          {specialties.length > 0 && (
            <div
              className="rounded-2xl bg-white p-5 space-y-3"
              style={{ boxShadow: "0 2px 16px rgba(0,0,0,0.06), 0 1px 3px rgba(0,0,0,0.04)" }}
            >
              <div className="flex items-center gap-2">
                <Tag className="h-4 w-4 text-slate-400" />
                <h3 className="text-[11px] font-black uppercase tracking-widest text-slate-400">
                  Uzmanlık Alanları
                </h3>
              </div>
              <div className="flex flex-wrap gap-2">
                {specialties.map((s) => (
                  <span
                    key={s}
                    className="rounded-full px-3 py-1.5 text-xs font-bold"
                    style={{
                      background: "linear-gradient(135deg, #1A365D, #2D4A7A)",
                      color: "#fff",
                    }}
                  >
                    {s}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Back to list */}
          <Link
            href="/client/coaches"
            className="flex w-full items-center justify-center gap-2 rounded-2xl py-3.5 text-sm font-bold text-slate-500 transition-colors hover:text-slate-700"
            style={{ background: "#F8FAFC", border: "1px solid #E2E8F0" }}
          >
            <Users className="h-4 w-4" />
            Diğer Koçlara Bak
          </Link>
        </div>
      </div>
    </div>
  );
}

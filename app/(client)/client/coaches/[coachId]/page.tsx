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

import { TransformCarousel, type TransformationPhoto } from "@/components/shared/TransformCarousel";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { getCoachAvatarUrl } from "@/lib/coach-avatar";
import { PageHero } from "@/components/shared/PageHero";
import { RequestCoachButton } from "./RequestCoachButton";
import { ReviewsSection } from "./ReviewsSection";
import { SessionBookingButton } from "./SessionBookingButton";
import { SimilarCoaches } from "./SimilarCoaches";

function getInitials(name: string) {
  return name
    .split(" ")
    .map((p) => p[0] ?? "")
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function hexToRgba(hex: string, alpha: number) {
  const normalized = hex.replace("#", "");
  const expanded = normalized.length === 3
    ? normalized.split("").map((value) => `${value}${value}`).join("")
    : normalized;

  const intValue = Number.parseInt(expanded, 16);
  const r = (intValue >> 16) & 255;
  const g = (intValue >> 8) & 255;
  const b = intValue & 255;

  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
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
          slogan: true,
          accentColor: true,
          transformationPhotos: true,
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

  const avatarUrl = await getCoachAvatarUrl(coach.id);

  const profile       = coach.coachProfile;
  const accentColor   = profile?.accentColor || "#F97316";
  const specialties   = Array.isArray(profile?.specialties) ? (profile.specialties as string[]) : [];
  const transformationPhotos = Array.isArray(profile?.transformationPhotos)
    ? (profile?.transformationPhotos as TransformationPhoto[])
    : [];
  const relationStatus = coach.coachRelations[0]?.status ?? null;
  const messageHref   = `/chat/${coachId}`;
  const pkgCount      = profile?.packages.length ?? 0;
  const relationMeta =
    relationStatus === "ACCEPTED"
      ? { label: "Aktif Bağlantı", color: "#16A34A", bg: "rgba(34,197,94,0.12)" }
      : relationStatus === "PENDING"
        ? { label: "İstek Beklemede", color: "#D97706", bg: "rgba(245,158,11,0.12)" }
        : { label: "Henüz Bağlı Değilsin", color: "#64748B", bg: "rgba(148,163,184,0.14)" };

  return (
    <div className="space-y-6 pb-16">

      {/* ── Back link ── */}
      <Link
        href="/client/coaches"
        className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 transition-colors hover:text-slate-700"
      >
        <ChevronLeft className="h-3.5 w-3.5" />
        Koç Bul
      </Link>

      {/* ── Hero banner ── */}
      <PageHero
        // eyebrow="Elite Coach"
        title={coach.name}
        subtitle={profile?.slogan ?? (profile?.experienceYears != null ? `${profile.experienceYears} yıl tecrübe` : undefined)}
        variant="light"
        avatar={{ initials: getInitials(coach.name), variant: "navy", imageUrl: avatarUrl }}
        statBoxes={[
          { label: "Deneyim",  value: profile?.experienceYears ? `${profile.experienceYears} yıl` : "—", icon: Star },
          { label: "Uzmanlık", value: `${specialties.length}`, icon: Award },
          { label: "Paket",    value: `${pkgCount}`, icon: Briefcase },
        ]}
      >
        {/* Bio */}
        {profile?.bio && (
          <p className="text-sm leading-relaxed text-slate-600 max-w-2xl">{profile.bio}</p>
        )}
        {/* Social link */}
        {profile?.socialMediaUrl && (
          <a
            href={profile.socialMediaUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-2 inline-flex items-center gap-1 text-xs font-bold text-orange-600 hover:text-orange-700 transition-colors"
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
                style={{
                  background: hexToRgba(accentColor, 0.12),
                  color: accentColor,
                  border: `1px solid ${hexToRgba(accentColor, 0.24)}`,
                }}
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
          {transformationPhotos.length > 0 && (
            <TransformCarousel items={transformationPhotos} />
          )}

          <ReviewsSection
            coachId={coachId}
            isConnected={relationStatus !== null}
          />

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
              className="rounded-2xl bg-gradient-to-br from-white to-slate-50 p-8 text-center border border-slate-100"
              style={{ boxShadow: "0 2px 16px rgba(0,0,0,0.06), 0 1px 3px rgba(0,0,0,0.04)" }}
            >
              <div
                className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl"
                style={{ background: "rgba(249,115,22,0.12)" }}
              >
                <Briefcase className="h-7 w-7" style={{ color: "#F97316" }} />
              </div>
              <p className="font-bold text-slate-700">Henüz paket bilgisi yok</p>
              <p className="mt-1 text-sm text-slate-500">Fiyat ve detaylar için mesaj gönderebilirsiniz.</p>
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
                  className="group flex flex-col overflow-hidden rounded-2xl bg-white transition-all duration-200 hover:-translate-y-1 hover:shadow-xl"
                  style={{ boxShadow: "0 2px 16px rgba(0,0,0,0.06), 0 1px 3px rgba(0,0,0,0.04)" }}
                >
                  {/* top accent */}
                  <div
                    className="h-1.5 w-full"
                    style={{ background: `linear-gradient(90deg, ${accentColor}CC, ${accentColor})` }}
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
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-black text-slate-800">{pkg.title}</p>
                          {pkg.isPopular && (
                            <span
                              className="rounded-full px-2 py-0.5 text-[10px] font-black text-white"
                              style={{ background: "linear-gradient(135deg, #FB923C, #EA580C)" }}
                            >
                              ⭐ Popüler
                            </span>
                          )}
                        </div>
                        {pkg.description && (
                          <p className="mt-1 text-xs text-slate-400 leading-relaxed line-clamp-3">
                            {pkg.description}
                          </p>
                        )}
                        {(() => {
                          let feats: string[] = [];
                          try { feats = JSON.parse((pkg as { features?: string }).features ?? "[]"); } catch { /* */ }
                          return feats.length > 0 ? (
                            <ul className="mt-2 space-y-0.5">
                              {feats.map((f: string) => (
                                <li key={f} className="flex items-center gap-1.5 text-xs text-slate-600">
                                  <span className="text-green-500 font-bold">✓</span>{f}
                                </li>
                              ))}
                            </ul>
                          ) : null;
                        })()}
                      </div>
                    </div>

                    <div className="mb-3 rounded-xl bg-slate-50 px-3 py-2.5">
                      <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Paket Türü</p>
                      <p className="mt-0.5 text-xs font-bold text-slate-600">Online Koçluk</p>
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
        <div className="space-y-4 self-start xl:sticky xl:top-24">

          {/* Request / status card */}
          <div
            className="rounded-2xl bg-white p-5 space-y-4 border border-slate-100"
            style={{ boxShadow: "0 2px 16px rgba(0,0,0,0.06), 0 1px 3px rgba(0,0,0,0.04)" }}
          >
            <h3 className="text-[11px] font-black uppercase tracking-widest text-slate-500">
              Bağlantı Durumu
            </h3>
            <div className="rounded-xl px-3 py-2" style={{ background: relationMeta.bg }}>
              <p className="text-[11px] font-black" style={{ color: relationMeta.color }}>{relationMeta.label}</p>
            </div>
            <RequestCoachButton coachId={coachId} initialStatus={relationStatus} />
          </div>

          {/* Message card */}
          <div
            className="rounded-2xl bg-gradient-to-br from-slate-50 to-white p-5 space-y-3 border border-slate-100"
            style={{ boxShadow: "0 2px 16px rgba(0,0,0,0.06), 0 1px 3px rgba(0,0,0,0.04)" }}
          >
            <h3 className="text-[11px] font-black uppercase tracking-widest text-slate-500">
              İletişim
            </h3>
            <Link
              href={messageHref}
              className="flex w-full items-center justify-center gap-2 rounded-2xl py-3.5 text-sm font-black uppercase tracking-wider text-white transition-all hover:shadow-lg"
              style={{
                background: "linear-gradient(135deg, #FB923C, #EA580C)",
                boxShadow: "0 4px 14px rgba(249,115,22,0.35)",
              }}
            >
              <MessageCircle className="h-4 w-4" />
              Mesaj Gönder
            </Link>
            {relationStatus === "ACCEPTED" && (
              <SessionBookingButton coachId={coachId} coachName={coach.name} />
            )}
          </div>

          {/* Specialties recap */}
          {specialties.length > 0 && (
            <div
              className="rounded-2xl bg-white p-5 space-y-3 border border-slate-100"
              style={{ boxShadow: "0 2px 16px rgba(0,0,0,0.06), 0 1px 3px rgba(0,0,0,0.04)" }}
            >
              <div className="flex items-center gap-2">
                <Tag className="h-4 w-4 text-slate-400" />
                <h3 className="text-[11px] font-black uppercase tracking-widest text-slate-500">
                  Uzmanlık Alanları
                </h3>
              </div>
              <div className="flex flex-wrap gap-2">
                {specialties.map((s) => (
                  <span
                    key={s}
                    className="rounded-full px-3 py-1.5 text-xs font-bold"
                    style={{
                      background: `${accentColor}18`,
                      color: accentColor,
                      border: `1px solid ${accentColor}33`,
                    }}
                  >
                    {s}
                  </span>
                ))}
              </div>
            </div>
          )}

          <SimilarCoaches coachId={coachId} />

          {/* Back to list */}
          <Link
            href="/client/coaches"
            className="flex w-full items-center justify-center gap-2 rounded-2xl py-3.5 text-sm font-bold text-slate-600 transition-all hover:bg-slate-100 hover:text-slate-800"
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

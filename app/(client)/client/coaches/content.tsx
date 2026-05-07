"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  BadgeCheck,
  Briefcase,
  Clock3,
  Loader2,
  MessageCircle,
  Search,
  Star,
  UserCheck,
  UserPlus,
  Users,
  X,
  Zap,
} from "lucide-react";
import { useConfirmation } from "@/contexts/ConfirmationContext";
import { useNotificationContext } from "@/contexts/NotificationContext";
import { ActionMenu } from "@/components/ui/action-menu";
import { PageHero } from "@/components/shared/PageHero";

/* ─── Types ──────────────────────────────────────────── */
type Coach = {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string | null;
  requestStatus: "PENDING" | "ACCEPTED" | "REJECTED" | null;
};

type MarketplaceCoach = {
  id: string;
  name: string;
  avatarUrl?: string | null;
  coachProfile: {
    bio: string | null;
    slogan: string | null;
    accentColor: string | null;
    transformationPhotos: Array<{ beforeUrl: string; afterUrl: string; title?: string }> | null;
    specialties: string[] | null;
    experienceYears: number | null;
    packages: { id: string }[];
  } | null;
};

/* ─── Helpers ─────────────────────────────────────────── */
function getInitials(name: string) {
  return name.split(" ").map((p) => p[0] ?? "").join("").toUpperCase().slice(0, 2);
}

const POPULAR_SPECIALTIES = [
  "Kilo Verme",
  "Güç Antrenmanı",
  "Hacim Kazanma",
  "Kardiyovasküler",
  "Sporcu Performansı",
];

/* ─── Avatar ──────────────────────────────────────────── */
function CoachAvatar({ name, imageUrl, size = 48 }: { name: string; imageUrl?: string | null; size?: number }) {
  return (
    <div
      className="flex items-center justify-center rounded-full font-black text-white flex-shrink-0"
      style={{
        width: size,
        height: size,
        fontSize: size * 0.35,
        background: "linear-gradient(135deg, #1A365D, #2D4A7A)",
        boxShadow: "0 2px 8px rgba(26,54,93,0.3)",
      }}
    >
      {imageUrl ? (
        <img src={imageUrl} alt={name} className="h-full w-full rounded-full object-cover" />
      ) : (
        getInitials(name)
      )}
    </div>
  );
}

/* ─── Main Component ──────────────────────────────────── */
export default function ClientCoachesContent() {
  const { push } = useNotificationContext();
  const { confirm } = useConfirmation();

  const [tab, setTab] = useState<"my" | "find">("my");
  const [coaches, setCoaches] = useState<Coach[]>([]);
  const [loadingCoachId, setLoadingCoachId] = useState<string | null>(null);

  // Marketplace state
  const [marketCoaches, setMarketCoaches] = useState<MarketplaceCoach[]>([]);
  const [marketLoading, setMarketLoading] = useState(false);
  const [query, setQuery] = useState("");
  const [specialty, setSpecialty] = useState("");

  /* load my coaches */
  const loadCoaches = useCallback(async (q = "") => {
    const res = await fetch(`/api/client/coaches${q ? `?q=${encodeURIComponent(q)}` : ""}`);
    const data = await res.json().catch(() => ({}));
    if (!res.ok) { push(data.error || "Koç listesi yüklenemedi."); return; }
    setCoaches(data.coaches || []);
  }, [push]);

  useEffect(() => { void loadCoaches(); }, [loadCoaches]);

  /* load marketplace */
  const loadMarket = useCallback(async (q = "", spec = "") => {
    setMarketLoading(true);
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (spec) params.set("specialty", spec);
    const res = await fetch(`/api/marketplace/coaches?${params.toString()}`);
    const data = await res.json() as { coaches: MarketplaceCoach[] };
    setMarketCoaches(data.coaches ?? []);
    setMarketLoading(false);
  }, []);

  useEffect(() => { if (tab === "find") void loadMarket(); }, [tab, loadMarket]);

  /* stats */
  const stats = useMemo(() => ({
    accepted: coaches.filter((c) => c.requestStatus === "ACCEPTED").length,
    pending:  coaches.filter((c) => c.requestStatus === "PENDING").length,
    pool:     coaches.length,
  }), [coaches]);
  const relationByCoachId = useMemo(
    () => new Map(coaches.map((coach) => [coach.id, coach.requestStatus])),
    [coaches]
  );

  const myCoaches  = coaches.filter((c) => c.requestStatus === "ACCEPTED");
  const pending    = coaches.filter((c) => c.requestStatus === "PENDING");

  /* actions */
  const requestCoach = async (coachId: string) => {
    setLoadingCoachId(coachId);
    const res = await fetch("/api/client/coaches/request", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ coachId }),
    });
    setLoadingCoachId(null);
    if (!res.ok) { push("Koç isteği gönderilemedi."); return; }
    push("Koç isteği gönderildi.");
    await loadCoaches();
  };

  const disconnectCoach = async (coachId: string) => {
    const ok = await confirm({
      title: "Koç bağlantısını kaldır",
      description: "Bu koç ile bağlantıyı kaldırmak istediğinize emin misiniz?",
      confirmText: "Kaldır",
      cancelText: "Vazgeç",
      danger: true,
    });
    if (!ok) return;
    setLoadingCoachId(coachId);
    const res = await fetch(`/api/client/coaches/${coachId}`, { method: "DELETE" });
    const data = await res.json().catch(() => ({}));
    setLoadingCoachId(null);
    if (!res.ok) { push(data.error || "Koç bağlantısı kaldırılamadı."); return; }
    push("Koç bağlantısı kaldırıldı.");
    await loadCoaches();
  };

  /* ─── Render ─────────────────────────────────────────── */
  return (
    <div className="space-y-6 pb-10">

      {/* ── Hero header ── */}
      <PageHero
        eyebrow="Koç Ağı"
        title="Koçlarım"
        subtitle="Koç bul, bağlantı yönet ve iletişim kur."
        variant="light"
        stats={[
          { label: "Aktif Koç",      value: stats.accepted, color: "#22C55E", bg: "rgba(34,197,94,0.15)" },
          { label: "Bekleyen İstek", value: stats.pending,  color: "#F59E0B", bg: "rgba(245,158,11,0.15)" },
          { label: "Koç Havuzu",     value: stats.pool,     color: "#2563EB", bg: "rgba(37,99,235,0.15)" },
        ]}
      />

      {/* ── Tabs ── */}
      <div className="flex border-b border-slate-200">
        {[
          { k: "my"   as const, label: "Koçlarım", icon: UserCheck },
          { k: "find" as const, label: "Koç Bul",  icon: Search },
        ].map(({ k, label, icon: Icon }) => (
          <button
            key={k}
            type="button"
            onClick={() => setTab(k)}
            className={[
              "flex items-center gap-2 pb-3 pr-6 text-sm font-bold transition-all duration-150",
              tab === k
                ? "border-b-2 border-orange-500 text-orange-500"
                : "border-b-2 border-transparent text-slate-400 hover:text-slate-700",
            ].join(" ")}
          >
            <Icon className="h-4 w-4" />
            {label}
          </button>
        ))}
      </div>

      {/* ── MY COACHES TAB ── */}
      {tab === "my" && (
        <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">
          <div className="space-y-6 xl:col-span-2">
            {/* Active coaches grid */}
            {myCoaches.length > 0 && (
              <div>
                <h2 className="mb-3 text-[11px] font-black uppercase tracking-widest text-slate-400">Aktif Bağlantılar</h2>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  {myCoaches.map((coach) => (
                    <div
                      key={coach.id}
                      className="overflow-hidden rounded-2xl bg-white"
                      style={{ boxShadow: "0 2px 16px rgba(0,0,0,0.06), 0 1px 3px rgba(0,0,0,0.04)" }}
                    >
                      {/* Top accent */}
                      <div className="h-1 w-full" style={{ background: "linear-gradient(90deg, #22C55E, #16A34A)" }} />
                      <div className="p-5">
                        <div className="mb-4 flex items-start gap-3">
                          <CoachAvatar name={coach.name} imageUrl={coach.avatarUrl} size={52} />
                          <div className="min-w-0 flex-1">
                            <div className="mb-1 flex items-center gap-2">
                              <p className="truncate text-base font-black text-slate-800">{coach.name}</p>
                              <span
                                className="flex-shrink-0 rounded-full px-2 py-0.5 text-[9px] font-black uppercase tracking-wider"
                                style={{ background: "rgba(34,197,94,0.12)", color: "#16A34A" }}
                              >
                                <BadgeCheck className="mr-0.5 inline h-3 w-3" />
                                Aktif
                              </span>
                            </div>
                            <p className="truncate text-xs text-slate-400">{coach.email}</p>
                          </div>
                        </div>

                        <div className="flex gap-2">
                          <Link
                            href={`/chat/${coach.id}`}
                            className="flex flex-1 items-center justify-center gap-1.5 rounded-xl py-2 text-xs font-black uppercase tracking-wider text-white transition-opacity hover:opacity-90"
                            style={{ background: "linear-gradient(135deg, #1A365D, #2D4A7A)" }}
                          >
                            <MessageCircle className="h-3.5 w-3.5" />
                            Mesaj
                          </Link>
                          <ActionMenu
                            items={[{
                              label: "Bağlantıyı Kaldır",
                              danger: true,
                              onClick: () => { void disconnectCoach(coach.id); },
                            }]}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Pending requests */}
            {pending.length > 0 && (
              <div>
                <h2 className="mb-3 text-[11px] font-black uppercase tracking-widest text-slate-400">Bekleyen İstekler</h2>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  {pending.map((coach) => (
                    <div
                      key={coach.id}
                      className="overflow-hidden rounded-2xl bg-white"
                      style={{ boxShadow: "0 2px 16px rgba(0,0,0,0.06), 0 1px 3px rgba(0,0,0,0.04)" }}
                    >
                      <div className="h-1 w-full" style={{ background: "linear-gradient(90deg, #F59E0B, #D97706)" }} />
                      <div className="flex items-center gap-3 p-5">
                        <CoachAvatar name={coach.name} size={44} />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-black text-slate-800">{coach.name}</p>
                          <p className="truncate text-xs text-slate-400">{coach.email}</p>
                        </div>
                        <span
                          className="flex flex-shrink-0 items-center gap-1 rounded-full px-2.5 py-1 text-[9px] font-black uppercase tracking-wider"
                          style={{ background: "rgba(245,158,11,0.12)", color: "#D97706" }}
                        >
                          <Clock3 className="h-3 w-3" />
                          Bekliyor
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Empty state */}
            {myCoaches.length === 0 && pending.length === 0 && (
              <div
                className="rounded-2xl bg-white p-10 text-center"
                style={{ boxShadow: "0 2px 16px rgba(0,0,0,0.06), 0 1px 3px rgba(0,0,0,0.04)" }}
              >
                <div
                  className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl"
                  style={{ background: "rgba(249,115,22,0.08)" }}
                >
                  <Users className="h-7 w-7 text-orange-300" />
                </div>
                <p className="font-bold text-slate-700">Henüz bağlı koçun yok</p>
                <p className="mb-4 mt-1 text-sm text-slate-400">Sana uygun bir koç bulmak için "Koç Bul" sekmesine geç.</p>
                <button
                  type="button"
                  onClick={() => setTab("find")}
                  className="inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-black text-white"
                  style={{ background: "linear-gradient(135deg, #FB923C, #EA580C)", boxShadow: "0 4px 14px rgba(249,115,22,0.3)" }}
                >
                  <Zap className="h-4 w-4" />
                  Koç Bul
                </button>
              </div>
            )}
          </div>

          <div className="space-y-4">
            <div className="rounded-2xl bg-white p-5" style={{ boxShadow: "0 2px 16px rgba(0,0,0,0.06), 0 1px 3px rgba(0,0,0,0.04)" }}>
              <h3 className="mb-3 text-[11px] font-black uppercase tracking-widest text-slate-400">Bağlantı Özeti</h3>
              <div className="space-y-2.5">
                {[
                  { label: "Aktif Koç", value: stats.accepted, color: "#16A34A", bg: "rgba(34,197,94,0.12)" },
                  { label: "Bekleyen", value: stats.pending, color: "#D97706", bg: "rgba(245,158,11,0.12)" },
                  { label: "Toplam", value: coaches.length, color: "#2563EB", bg: "rgba(37,99,235,0.12)" },
                ].map((item) => (
                  <div key={item.label} className="flex items-center justify-between rounded-xl px-3 py-2.5" style={{ background: item.bg }}>
                    <span className="text-xs font-bold text-slate-600">{item.label}</span>
                    <span className="text-base font-black" style={{ color: item.color }}>{item.value}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-2xl bg-white p-5" style={{ boxShadow: "0 2px 16px rgba(0,0,0,0.06), 0 1px 3px rgba(0,0,0,0.04)" }}>
              <h3 className="mb-3 text-[11px] font-black uppercase tracking-widest text-slate-400">Hızlı İşlemler</h3>
              <div className="space-y-2">
                <button
                  type="button"
                  onClick={() => setTab("find")}
                  className="flex w-full items-center justify-between rounded-xl p-3 text-left transition-colors hover:bg-slate-50"
                >
                  <span className="text-sm font-bold text-slate-700">Yeni Koç Keşfet</span>
                  <span className="text-xs font-black text-orange-500">Aç</span>
                </button>
                <Link
                  href="/messages"
                  className="flex w-full items-center justify-between rounded-xl p-3 text-left transition-colors hover:bg-slate-50"
                >
                  <span className="text-sm font-bold text-slate-700">Mesajları Gör</span>
                  <span className="text-xs font-black text-[#1A365D]">Git</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── FIND COACHES TAB ── */}
      {tab === "find" && (
        <div className="space-y-5">
          {/* Search bar */}
          <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
            <form
              onSubmit={(e) => { e.preventDefault(); void loadMarket(query, specialty); }}
              className="space-y-3 xl:col-span-2"
            >
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Koç adı ile ara..."
                    className="h-11 w-full rounded-xl border-0 bg-white pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                    style={{ boxShadow: "0 2px 8px rgba(0,0,0,0.06), 0 1px 3px rgba(0,0,0,0.04)" }}
                  />
                </div>
                <button
                  type="submit"
                  className="rounded-xl px-5 text-sm font-black text-white transition hover:opacity-90"
                  style={{ background: "linear-gradient(135deg, #FB923C, #EA580C)", boxShadow: "0 4px 14px rgba(249,115,22,0.3)" }}
                >
                  Ara
                </button>
                {(query || specialty) && (
                  <button
                    type="button"
                    onClick={() => { setQuery(""); setSpecialty(""); void loadMarket("", ""); }}
                    className="rounded-xl border border-slate-200 px-3 text-slate-400 transition hover:bg-slate-50"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>

              {/* Specialty pills */}
              <div className="flex flex-wrap gap-2">
                {POPULAR_SPECIALTIES.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => {
                      const next = specialty === s ? "" : s;
                      setSpecialty(next);
                      void loadMarket(query, next);
                    }}
                    className={[
                      "rounded-full px-3 py-1.5 text-xs font-bold transition-all",
                      specialty === s
                        ? "text-white"
                        : "bg-white text-slate-500 ring-1 ring-black/10 hover:text-orange-500",
                    ].join(" ")}
                    style={specialty === s ? {
                      background: "linear-gradient(135deg, #FB923C, #EA580C)",
                      boxShadow: "0 2px 8px rgba(249,115,22,0.3)",
                    } : undefined}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </form>

            <div className="rounded-2xl bg-white p-4" style={{ boxShadow: "0 2px 16px rgba(0,0,0,0.06), 0 1px 3px rgba(0,0,0,0.04)" }}>
              <p className="text-[11px] font-black uppercase tracking-widest text-slate-400">Keşif Özeti</p>
              <p className="mt-2 text-2xl font-black text-slate-800">{marketCoaches.length}</p>
              <p className="text-xs text-slate-400">eşleşen koç</p>
              <div className="mt-4 rounded-xl bg-slate-50 px-3 py-2.5">
                <p className="text-[11px] font-bold text-slate-600">İpucu</p>
                <p className="mt-1 text-[11px] leading-relaxed text-slate-400">Önce uzmanlık filtresi seç, sonra isim aramasıyla daralt.</p>
              </div>
            </div>
          </div>

          {/* Results */}
          {marketLoading ? (
            <div className="flex justify-center py-16">
              <Loader2 className="h-8 w-8 animate-spin text-slate-300" />
            </div>
          ) : marketCoaches.length === 0 ? (
            <div
              className="bg-white rounded-2xl p-10 text-center"
              style={{ boxShadow: "0 2px 16px rgba(0,0,0,0.06), 0 1px 3px rgba(0,0,0,0.04)" }}
            >
              <Users className="h-10 w-10 text-slate-200 mx-auto mb-3" />
              <p className="text-sm font-bold text-slate-600">
                {query || specialty ? "Arama kriterlerine uygun koç bulunamadı." : "Henüz profil oluşturmuş koç bulunmuyor."}
              </p>
              {(query || specialty) && (
                <button
                  type="button"
                  onClick={() => { setQuery(""); setSpecialty(""); void loadMarket("", ""); }}
                  className="mt-3 text-xs text-orange-500 hover:underline"
                >
                  Filtreleri temizle
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {marketCoaches.map((coach) => {
                const profile  = coach.coachProfile;
                const specs    = Array.isArray(profile?.specialties) ? (profile.specialties as string[]) : [];
                const pkgCount = profile?.packages.length ?? 0;
                const relationStatus = relationByCoachId.get(coach.id) ?? null;
                const isPending = relationStatus === "PENDING";
                const isConnected = relationStatus === "ACCEPTED";
                const isRequestDisabled = loadingCoachId === coach.id || isPending || isConnected;

                return (
                  <Link
                    key={coach.id}
                    href={`/client/coaches/${coach.id}`}
                    className="group bg-white rounded-2xl overflow-hidden flex flex-col transition-all duration-200 hover:shadow-lg"
                    style={{ boxShadow: "0 2px 16px rgba(0,0,0,0.06), 0 1px 3px rgba(0,0,0,0.04)" }}
                  >
                    {/* Colored top bar */}
                    <div
                      className="h-1 w-full transition-all duration-300 group-hover:h-1.5"
                      style={{ background: "linear-gradient(90deg, #FB923C, #EA580C)" }}
                    />

                    <div className="p-5 flex flex-col flex-1">
                      {/* Avatar + name */}
                      <div className="flex items-start gap-3 mb-3">
                        <CoachAvatar name={coach.name} imageUrl={coach.avatarUrl} size={52} />
                        <div className="flex-1 min-w-0">
                          <p className="font-black text-slate-800 text-base leading-tight truncate group-hover:text-orange-600 transition-colors">
                            {coach.name}
                          </p>
                          {profile?.experienceYears != null && (
                            <p className="mt-0.5 flex items-center gap-1 text-xs text-slate-400">
                              <Star className="h-3 w-3 text-amber-400" />
                              {profile.experienceYears} yıl tecrübe
                            </p>
                          )}
                        </div>
                        {isConnected && (
                          <span className="rounded-full px-2 py-0.5 text-[9px] font-black uppercase tracking-wider" style={{ background: "rgba(34,197,94,0.14)", color: "#16A34A" }}>
                            Aktif
                          </span>
                        )}
                        {isPending && (
                          <span className="rounded-full px-2 py-0.5 text-[9px] font-black uppercase tracking-wider" style={{ background: "rgba(245,158,11,0.15)", color: "#D97706" }}>
                            Bekliyor
                          </span>
                        )}
                      </div>

                      {profile?.slogan && (
                        <p className="mb-2 text-[11px] font-semibold text-orange-600">{profile.slogan}</p>
                      )}

                      {/* Bio */}
                      {profile?.bio && (
                        <p className="text-xs text-slate-500 leading-relaxed line-clamp-2 mb-3">
                          {profile.bio}
                        </p>
                      )}

                      {/* Specialties */}
                      {specs.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mb-3">
                          {specs.slice(0, 3).map((s) => (
                            <span
                              key={s}
                              className="rounded-full px-2.5 py-0.5 text-[10px] font-bold"
                              style={{ background: "rgba(249,115,22,0.08)", color: "#EA580C" }}
                            >
                              {s}
                            </span>
                          ))}
                          {specs.length > 3 && (
                            <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[10px] font-bold text-slate-400">
                              +{specs.length - 3}
                            </span>
                          )}
                        </div>
                      )}

                      {/* Footer */}
                      <div className="mt-auto pt-3 flex items-center justify-between border-t border-slate-100">
                        <span className="flex items-center gap-1.5 text-xs text-slate-400">
                          <Briefcase className="h-3.5 w-3.5" />
                          {pkgCount > 0 ? `${pkgCount} paket` : "Paket yok"}
                        </span>
                        <span className="text-xs font-black text-orange-500 group-hover:underline">
                          Profili Gör →
                        </span>
                      </div>

                      {/* Request button */}
                      {isConnected ? (
                        <Link
                          href={`/chat/${coach.id}`}
                          onClick={(e) => e.stopPropagation()}
                          className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-xl bg-[#1A365D] py-2.5 text-xs font-black uppercase tracking-wider text-white transition-opacity hover:opacity-90"
                        >
                          <MessageCircle className="h-3.5 w-3.5" />
                          Mesaj Gönder
                        </Link>
                      ) : (
                        <button
                          type="button"
                          onClick={(e) => { e.preventDefault(); void requestCoach(coach.id); }}
                          disabled={isRequestDisabled}
                          className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-xl py-2.5 text-xs font-black uppercase tracking-wider text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-55"
                          style={{ background: "linear-gradient(135deg, #1A365D, #2D4A7A)" }}
                        >
                          <UserPlus className="h-3.5 w-3.5" />
                          {loadingCoachId === coach.id ? "Gönderiliyor..." : isPending ? "İstek Beklemede" : "İstek Gönder"}
                        </button>
                      )}
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

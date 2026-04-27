"use client";

import { useEffect, useState } from "react";
import {
  Award,
  Briefcase,
  ChevronRight,
  ExternalLink,
  Link2,
  Loader2,
  LogOut,
  Plus,
  Save,
  Sparkles,
  Star,
  Tag,
  Trash2,
  Users,
  X,
} from "lucide-react";
import { signOut } from "next-auth/react";
import { useNotificationContext } from "@/contexts/NotificationContext";

/* ─── Types ─────────────────────────────────────────── */
type CoachPackage = {
  id: string;
  title: string;
  description: string | null;
  price: number | null;
  isActive: boolean;
};

type CoachProfileData = {
  bio: string | null;
  specialties: string[] | null;
  experienceYears: number | null;
  socialMediaUrl: string | null;
  packages: CoachPackage[];
  name?: string;
};

const SPECIALTY_SUGGESTIONS = [
  "Kilo Verme",
  "Güç Antrenmanı",
  "Kardiyovasküler",
  "Hacim Kazanma",
  "Esneklik & Mobilite",
  "Rehabilitasyon",
  "Sporcu Performansı",
  "Beslenme Danışmanlığı",
];

function getInitials(name: string) {
  return name.split(" ").map((p) => p[0] ?? "").join("").toUpperCase().slice(0, 2);
}

/* ─── Input style ─────────────────────────────────── */
const inputCls =
  "h-11 w-full rounded-xl border-0 bg-slate-50 px-4 text-sm font-medium text-slate-700 " +
  "focus:outline-none focus:ring-2 focus:ring-orange-400 transition placeholder:text-slate-300";

const textareaCls =
  "w-full rounded-xl border-0 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-700 leading-relaxed " +
  "focus:outline-none focus:ring-2 focus:ring-orange-400 transition resize-none placeholder:text-slate-300";

/* ─── Component ─────────────────────────────────────── */
export default function CoachProfilePage() {
  const { success, error: notifyError } = useNotificationContext();

  const [loading, setSaving_]     = useState(true);   // reuse name for clarity below
  const [saving, setSaving]       = useState(false);
  const [name, setName]           = useState("Koç");

  // Profile form
  const [bio,              setBio]              = useState("");
  const [specialties,      setSpecialties]      = useState<string[]>([]);
  const [specialtyInput,   setSpecialtyInput]   = useState("");
  const [experienceYears,  setExperienceYears]  = useState("");
  const [socialMediaUrl,   setSocialMediaUrl]   = useState("");

  // Packages
  const [packages,    setPackages]    = useState<CoachPackage[]>([]);
  const [pkgSaving,   setPkgSaving]   = useState(false);
  const [pkgTitle,    setPkgTitle]    = useState("");
  const [pkgDesc,     setPkgDesc]     = useState("");
  const [pkgPrice,    setPkgPrice]    = useState("");
  const [deletingId,  setDeletingId]  = useState<string | null>(null);

  const setLoading = setSaving_; // alias

  useEffect(() => {
    (async () => {
      setLoading(true);
      const res  = await fetch("/api/profile");
      const data = await res.json();
      if (data.profile) {
        const p = data.profile as CoachProfileData;
        setBio(p.bio ?? "");
        setSpecialties(Array.isArray(p.specialties) ? p.specialties : []);
        setExperienceYears(p.experienceYears != null ? String(p.experienceYears) : "");
        setSocialMediaUrl(p.socialMediaUrl ?? "");
        setPackages(p.packages ?? []);
        if (p.name) setName(p.name);
      }
      setLoading(false);
    })();
  }, []);

  /* ── actions ── */
  const handleSaveProfile = async () => {
    setSaving(true);
    const res = await fetch("/api/profile", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        bio:             bio             || null,
        specialties:     specialties.length > 0 ? specialties : null,
        experienceYears: experienceYears ? Number(experienceYears) : null,
        socialMediaUrl:  socialMediaUrl  || null,
      }),
    });
    setSaving(false);
    if (!res.ok) { notifyError("Profil kaydedilemedi."); return; }
    success("Profil güncellendi.");
  };

  const addSpecialty = (val: string) => {
    const trimmed = val.trim();
    if (!trimmed || specialties.includes(trimmed)) return;
    setSpecialties([...specialties, trimmed]);
    setSpecialtyInput("");
  };

  const handleAddPackage = async () => {
    if (!pkgTitle.trim()) { notifyError("Paket başlığı zorunludur."); return; }
    setPkgSaving(true);
    const res = await fetch("/api/coach/packages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title:       pkgTitle.trim(),
        description: pkgDesc.trim() || null,
        price:       pkgPrice ? Number(pkgPrice) : null,
      }),
    });
    setPkgSaving(false);
    if (!res.ok) {
      const d = await res.json().catch(() => ({})) as { error?: string };
      notifyError(d.error ?? "Paket eklenemedi.");
      return;
    }
    const data = await res.json() as { package: CoachPackage };
    setPackages([...packages, data.package]);
    setPkgTitle(""); setPkgDesc(""); setPkgPrice("");
    success("Paket eklendi.");
  };

  const handleDeletePackage = async (id: string) => {
    setDeletingId(id);
    const res = await fetch(`/api/coach/packages/${id}`, { method: "DELETE" });
    setDeletingId(null);
    if (!res.ok) { notifyError("Paket silinemedi."); return; }
    setPackages(packages.filter((p) => p.id !== id));
    success("Paket silindi.");
  };

  /* ── loading state ── */
  if (loading) {
    return (
      <div className="flex min-h-[40dvh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-slate-300" />
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-16">

      {/* ── Hero banner ── */}
      <div
        className="relative overflow-hidden rounded-2xl p-6 md:p-8"
        style={{ background: "linear-gradient(135deg, #1A365D 0%, #0F172A 100%)" }}
      >
        <div
          className="pointer-events-none absolute -right-20 -top-20 h-56 w-56 rounded-full"
          style={{ background: "radial-gradient(circle, rgba(249,115,22,0.2) 0%, transparent 70%)" }}
        />
        <div className="relative z-10 flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <div
              className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-2xl text-xl font-black text-white"
              style={{
                background: "linear-gradient(135deg, #1A365D, #2D4A7A)",
                boxShadow: "0 4px 14px rgba(26,54,93,0.5)",
                border: "2px solid rgba(249,115,22,0.4)",
              }}
            >
              {getInitials(name)}
            </div>
            <div>
              <span className="block text-[10px] font-bold uppercase tracking-[0.2em] text-orange-400 mb-0.5">
                Elite Coach
              </span>
              <h1 className="text-2xl font-black tracking-tight text-white">{name}</h1>
              <p className="text-sm text-slate-400">
                {experienceYears ? `${experienceYears} yıl deneyim` : "Profil & Vitrin"}
                {packages.length > 0 ? ` · ${packages.length} aktif paket` : ""}
              </p>
            </div>
          </div>

          {/* Stats */}
          <div className="flex flex-wrap gap-3">
            {[
              { icon: Star,  label: "Deneyim", value: experienceYears ? `${experienceYears} yıl` : "—" },
              { icon: Award, label: "Uzmanlık", value: `${specialties.length}` },
              { icon: Briefcase, label: "Paket", value: `${packages.length}` },
            ].map(({ icon: Icon, label, value }) => (
              <div
                key={label}
                className="flex flex-col items-center rounded-xl px-4 py-2.5"
                style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.08)" }}
              >
                <Icon className="mb-1 h-3.5 w-3.5 text-slate-400" />
                <span className="text-lg font-black text-white leading-none">{value}</span>
                <span className="mt-0.5 text-[10px] font-bold uppercase tracking-wider text-slate-500">{label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── 2-col desktop layout ── */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">

        {/* ── LEFT: vitrin form ── */}
        <div className="xl:col-span-2 space-y-5">

          {/* Bio card */}
          <div
            className="rounded-2xl bg-white p-6"
            style={{ boxShadow: "0 2px 16px rgba(0,0,0,0.06), 0 1px 3px rgba(0,0,0,0.04)" }}
          >
            <div className="mb-5 flex items-center gap-2">
              <div
                className="flex h-8 w-8 items-center justify-center rounded-xl"
                style={{ background: "rgba(249,115,22,0.1)" }}
              >
                <Sparkles className="h-4 w-4 text-orange-500" />
              </div>
              <h2 className="text-base font-black text-slate-800">Vitrin Bilgileri</h2>
              <span className="ml-auto text-[10px] font-bold uppercase tracking-widest text-slate-400">
                Keşfet sayfasında görünür
              </span>
            </div>

            {/* Bio */}
            <div className="mb-5 space-y-1.5">
              <label className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-400">
                <Sparkles className="h-3.5 w-3.5" />
                Hakkımda (Bio)
              </label>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                rows={4}
                maxLength={1000}
                placeholder="Antrenman felsefenizi, deneyimlerinizi ve yaklaşımınızı kısaca anlatın..."
                className={textareaCls}
              />
              <p className="text-right text-[11px] text-slate-300">{bio.length}/1000</p>
            </div>

            {/* Experience + Social grid */}
            <div className="mb-5 grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <label className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-400">
                  <Star className="h-3.5 w-3.5" />
                  Tecrübe (Yıl)
                </label>
                <input
                  type="number"
                  min={0}
                  max={50}
                  value={experienceYears}
                  onChange={(e) => setExperienceYears(e.target.value)}
                  placeholder="örn. 5"
                  className={inputCls}
                />
              </div>
              <div className="space-y-1.5">
                <label className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-400">
                  <Link2 className="h-3.5 w-3.5" />
                  Sosyal Medya Linki
                </label>
                <input
                  type="url"
                  value={socialMediaUrl}
                  onChange={(e) => setSocialMediaUrl(e.target.value)}
                  placeholder="https://instagram.com/..."
                  className={inputCls}
                />
              </div>
            </div>

            {/* Save button */}
            <button
              type="button"
              onClick={handleSaveProfile}
              disabled={saving}
              className="flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-black uppercase tracking-wider text-white transition-opacity hover:opacity-90 disabled:opacity-50"
              style={{
                background: "linear-gradient(135deg, #FB923C, #EA580C)",
                boxShadow: "0 4px 14px rgba(249,115,22,0.35)",
              }}
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              {saving ? "Kaydediliyor..." : "Profili Kaydet"}
            </button>
          </div>

          {/* Specialties card */}
          <div
            className="rounded-2xl bg-white p-6"
            style={{ boxShadow: "0 2px 16px rgba(0,0,0,0.06), 0 1px 3px rgba(0,0,0,0.04)" }}
          >
            <div className="mb-5 flex items-center gap-2">
              <div
                className="flex h-8 w-8 items-center justify-center rounded-xl"
                style={{ background: "rgba(37,99,235,0.1)" }}
              >
                <Award className="h-4 w-4 text-blue-500" />
              </div>
              <h2 className="text-base font-black text-slate-800">Uzmanlık Alanları</h2>
              <span
                className="ml-auto rounded-full px-2.5 py-0.5 text-xs font-black"
                style={{ background: "rgba(26,54,93,0.08)", color: "#1A365D" }}
              >
                {specialties.length}
              </span>
            </div>

            {/* Added specialties */}
            {specialties.length > 0 && (
              <div className="mb-4 flex flex-wrap gap-2">
                {specialties.map((s) => (
                  <span
                    key={s}
                    className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold"
                    style={{
                      background: "linear-gradient(135deg, #1A365D, #2D4A7A)",
                      color: "#fff",
                    }}
                  >
                    {s}
                    <button
                      type="button"
                      onClick={() => setSpecialties(specialties.filter((x) => x !== s))}
                      className="rounded-full p-0.5 opacity-70 hover:opacity-100 transition-opacity"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}

            {/* Input */}
            <div className="mb-4 flex gap-2">
              <input
                type="text"
                value={specialtyInput}
                onChange={(e) => setSpecialtyInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") { e.preventDefault(); addSpecialty(specialtyInput); }
                }}
                placeholder="Uzmanlık ekle..."
                className={inputCls + " flex-1"}
              />
              <button
                type="button"
                onClick={() => addSpecialty(specialtyInput)}
                className="flex h-11 w-11 items-center justify-center rounded-xl text-white transition-opacity hover:opacity-90"
                style={{ background: "linear-gradient(135deg, #FB923C, #EA580C)" }}
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>

            {/* Suggestions */}
            <div className="flex flex-wrap gap-2">
              {SPECIALTY_SUGGESTIONS.filter((s) => !specialties.includes(s)).map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => addSpecialty(s)}
                  className="flex items-center gap-1 rounded-full px-3 py-1.5 text-[11px] font-bold text-slate-500 transition-all hover:text-orange-500"
                  style={{
                    background: "#F8FAFC",
                    border: "1px solid #E2E8F0",
                  }}
                >
                  <Tag className="h-3 w-3" />
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Packages card */}
          <div
            className="rounded-2xl bg-white p-6"
            style={{ boxShadow: "0 2px 16px rgba(0,0,0,0.06), 0 1px 3px rgba(0,0,0,0.04)" }}
          >
            <div className="mb-5 flex items-center gap-2">
              <div
                className="flex h-8 w-8 items-center justify-center rounded-xl"
                style={{ background: "rgba(34,197,94,0.1)" }}
              >
                <Briefcase className="h-4 w-4 text-green-500" />
              </div>
              <h2 className="text-base font-black text-slate-800">Eğitim Paketleri</h2>
              <span
                className="ml-auto rounded-full px-2.5 py-0.5 text-xs font-black"
                style={{ background: "rgba(34,197,94,0.1)", color: "#16A34A" }}
              >
                {packages.length}
              </span>
            </div>

            {/* Package list */}
            {packages.length > 0 ? (
              <div className="mb-5 space-y-3">
                {packages.map((pkg) => (
                  <div
                    key={pkg.id}
                    className="flex items-start gap-3 rounded-xl p-4"
                    style={{ background: "#F8FAFC", border: "1px solid #E2E8F0" }}
                  >
                    <div
                      className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl"
                      style={{ background: "rgba(249,115,22,0.1)" }}
                    >
                      <Briefcase className="h-4 w-4 text-orange-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-black text-sm text-slate-800">{pkg.title}</p>
                      {pkg.description && (
                        <p className="mt-0.5 text-xs text-slate-400 line-clamp-2">{pkg.description}</p>
                      )}
                      {pkg.price != null ? (
                        <span
                          className="mt-2 inline-block rounded-full px-2.5 py-0.5 text-[11px] font-black"
                          style={{ background: "rgba(34,197,94,0.1)", color: "#16A34A" }}
                        >
                          {pkg.price.toLocaleString("tr-TR")} ₺
                        </span>
                      ) : (
                        <span
                          className="mt-2 inline-block rounded-full px-2.5 py-0.5 text-[11px] font-bold text-slate-400"
                          style={{ background: "#F1F5F9" }}
                        >
                          Fiyat belirtilmemiş
                        </span>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => handleDeletePackage(pkg.id)}
                      disabled={deletingId === pkg.id}
                      className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg text-slate-300 transition-colors hover:bg-red-50 hover:text-red-500"
                    >
                      {deletingId === pkg.id
                        ? <Loader2 className="h-4 w-4 animate-spin" />
                        : <Trash2 className="h-4 w-4" />}
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div
                className="mb-5 rounded-xl p-6 text-center"
                style={{ background: "#F8FAFC", border: "1px dashed #E2E8F0" }}
              >
                <Briefcase className="mx-auto mb-2 h-8 w-8 text-slate-200" />
                <p className="text-sm font-bold text-slate-400">
                  Henüz paket eklemediniz.
                </p>
                <p className="text-xs text-slate-300 mt-0.5">
                  Paket ekleyerek danışanlara sunabilirsiniz.
                </p>
              </div>
            )}

            {/* Add package form */}
            <div
              className="rounded-xl p-4 space-y-3"
              style={{ background: "#F8FAFC", border: "1px solid #E2E8F0" }}
            >
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                Yeni Paket Ekle
              </p>
              <input
                type="text"
                value={pkgTitle}
                onChange={(e) => setPkgTitle(e.target.value)}
                placeholder="Paket başlığı (örn. Aylık Online Koçluk)"
                className={inputCls}
              />
              <textarea
                value={pkgDesc}
                onChange={(e) => setPkgDesc(e.target.value)}
                rows={2}
                placeholder="Paket açıklaması (opsiyonel)..."
                className={textareaCls}
              />
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-300">₺</span>
                  <input
                    type="number"
                    min={0}
                    value={pkgPrice}
                    onChange={(e) => setPkgPrice(e.target.value)}
                    placeholder="Fiyat (boş = fiyat sor)"
                    className={inputCls + " pl-8"}
                  />
                </div>
                <button
                  type="button"
                  onClick={handleAddPackage}
                  disabled={pkgSaving}
                  className="flex items-center gap-2 rounded-xl px-5 text-sm font-black text-white transition-opacity hover:opacity-90 disabled:opacity-50"
                  style={{
                    background: "linear-gradient(135deg, #FB923C, #EA580C)",
                    boxShadow: "0 4px 10px rgba(249,115,22,0.3)",
                  }}
                >
                  {pkgSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                  Ekle
                </button>
              </div>
            </div>

            {/* Info note */}
            <div
              className="mt-4 flex items-start gap-2.5 rounded-xl px-4 py-3"
              style={{ background: "rgba(249,115,22,0.06)", border: "1px solid rgba(249,115,22,0.15)" }}
            >
              <ExternalLink className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-orange-400" />
              <p className="text-[11px] leading-relaxed text-slate-500">
                Paketlerdeki &ldquo;İletişime Geç&rdquo; butonları danışanları mesajlaşma ekranına yönlendirir.
                Ödeme platform dışında gerçekleşmez.
              </p>
            </div>
          </div>
        </div>

        {/* ── RIGHT: quick links + account ── */}
        <div className="space-y-4">

          {/* Profile completeness */}
          <div
            className="rounded-2xl bg-white p-5"
            style={{ boxShadow: "0 2px 16px rgba(0,0,0,0.06), 0 1px 3px rgba(0,0,0,0.04)" }}
          >
            <h3 className="mb-4 text-[11px] font-black uppercase tracking-widest text-slate-400">Profil Tamamlığı</h3>
            {(() => {
              const checks = [
                { label: "Bio",           done: bio.trim().length > 0 },
                { label: "Uzmanlık",      done: specialties.length > 0 },
                { label: "Deneyim",       done: experienceYears.length > 0 },
                { label: "Sosyal Medya",  done: socialMediaUrl.length > 0 },
                { label: "Paket",         done: packages.length > 0 },
              ];
              const score = checks.filter((c) => c.done).length;
              const pct   = Math.round((score / checks.length) * 100);
              return (
                <div className="space-y-3">
                  <div className="flex items-end justify-between">
                    <span className="text-2xl font-black" style={{ color: pct === 100 ? "#22C55E" : "#F97316" }}>
                      {pct}%
                    </span>
                    <span className="text-xs text-slate-400">{score}/{checks.length} tamamlandı</span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${pct}%`,
                        background: pct === 100
                          ? "linear-gradient(90deg, #22C55E, #16A34A)"
                          : "linear-gradient(90deg, #FB923C, #EA580C)",
                      }}
                    />
                  </div>
                  <div className="space-y-1.5">
                    {checks.map(({ label, done }) => (
                      <div key={label} className="flex items-center gap-2">
                        <div
                          className="h-4 w-4 flex-shrink-0 rounded-full flex items-center justify-center"
                          style={{
                            background: done ? "rgba(34,197,94,0.15)" : "#F1F5F9",
                          }}
                        >
                          {done && (
                            <svg viewBox="0 0 10 10" className="h-2.5 w-2.5" style={{ color: "#22C55E" }}>
                              <polyline points="2,5 4.5,7.5 8,3" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                          )}
                        </div>
                        <span className={`text-xs font-medium ${done ? "text-slate-600" : "text-slate-300"}`}>
                          {label}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })()}
          </div>

          {/* Quick links */}
          <div
            className="rounded-2xl bg-white p-5"
            style={{ boxShadow: "0 2px 16px rgba(0,0,0,0.06), 0 1px 3px rgba(0,0,0,0.04)" }}
          >
            <h3 className="mb-4 text-[11px] font-black uppercase tracking-widest text-slate-400">Hızlı Erişim</h3>
            <div className="space-y-2">
              {[
                { href: "/coach/clients",   icon: Users,    label: "Danışanlar",   sub: "Bağlı danışanlarını yönet", color: "#1A365D" },
                { href: "/coach/templates", icon: Briefcase, label: "Antrenmanlar", sub: "Template oluştur ve ata",    color: "#2563EB" },
              ].map(({ href, icon: Icon, label, sub, color }) => (
                <a
                  key={href}
                  href={href}
                  className="flex items-center justify-between rounded-xl p-3 transition-colors hover:bg-slate-50"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl"
                      style={{ background: `${color}18` }}
                    >
                      <Icon className="h-4 w-4" style={{ color }} />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-700">{label}</p>
                      <p className="text-[11px] text-slate-400">{sub}</p>
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-slate-300" />
                </a>
              ))}
            </div>
          </div>

          {/* Account / logout */}
          <div
            className="rounded-2xl bg-white p-5"
            style={{ boxShadow: "0 2px 16px rgba(0,0,0,0.06), 0 1px 3px rgba(0,0,0,0.04)" }}
          >
            <h3 className="mb-4 text-[11px] font-black uppercase tracking-widest text-slate-400">Hesap</h3>
            <button
              type="button"
              onClick={() => void signOut({ callbackUrl: "/login" })}
              className="flex w-full items-center gap-3 rounded-xl p-3 text-left transition-colors hover:bg-red-50"
            >
              <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-red-50">
                <LogOut className="h-4 w-4 text-red-500" />
              </div>
              <div>
                <p className="text-sm font-bold text-red-600">Çıkış Yap</p>
                <p className="text-[11px] text-slate-400">Oturumu kapat</p>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

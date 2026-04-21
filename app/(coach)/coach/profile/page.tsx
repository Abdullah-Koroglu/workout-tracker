"use client";

import { useEffect, useState } from "react";
import { Briefcase, ExternalLink, Loader2, Plus, Save, Sparkles, Tag, Trash2, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useNotificationContext } from "@/contexts/NotificationContext";

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

export default function CoachProfilePage() {
  const { success, error: notifyError } = useNotificationContext();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Profile form state
  const [bio, setBio] = useState("");
  const [specialties, setSpecialties] = useState<string[]>([]);
  const [specialtyInput, setSpecialtyInput] = useState("");
  const [experienceYears, setExperienceYears] = useState<string>("");
  const [socialMediaUrl, setSocialMediaUrl] = useState("");

  // Package state
  const [packages, setPackages] = useState<CoachPackage[]>([]);
  const [pkgSaving, setPkgSaving] = useState(false);
  const [pkgTitle, setPkgTitle] = useState("");
  const [pkgDescription, setPkgDescription] = useState("");
  const [pkgPrice, setPkgPrice] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const res = await fetch("/api/profile");
      const data = await res.json();
      if (data.profile) {
        const p = data.profile as CoachProfileData;
        setBio(p.bio ?? "");
        setSpecialties(Array.isArray(p.specialties) ? p.specialties : []);
        setExperienceYears(p.experienceYears != null ? String(p.experienceYears) : "");
        setSocialMediaUrl(p.socialMediaUrl ?? "");
        setPackages(p.packages ?? []);
      }
      setLoading(false);
    };
    load();
  }, []);

  const handleSaveProfile = async () => {
    setSaving(true);
    const res = await fetch("/api/profile", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        bio: bio || null,
        specialties: specialties.length > 0 ? specialties : null,
        experienceYears: experienceYears ? Number(experienceYears) : null,
        socialMediaUrl: socialMediaUrl || null,
      }),
    });
    setSaving(false);
    if (!res.ok) {
      notifyError("Profil kaydedilemedi.");
      return;
    }
    success("Profil güncellendi.");
  };

  const addSpecialty = (val: string) => {
    const trimmed = val.trim();
    if (!trimmed || specialties.includes(trimmed)) return;
    setSpecialties([...specialties, trimmed]);
    setSpecialtyInput("");
  };

  const removeSpecialty = (s: string) => {
    setSpecialties(specialties.filter((x) => x !== s));
  };

  const handleAddPackage = async () => {
    if (!pkgTitle.trim()) {
      notifyError("Paket başlığı zorunludur.");
      return;
    }
    setPkgSaving(true);
    const res = await fetch("/api/coach/packages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: pkgTitle.trim(),
        description: pkgDescription.trim() || null,
        price: pkgPrice ? Number(pkgPrice) : null,
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
    setPkgTitle("");
    setPkgDescription("");
    setPkgPrice("");
    success("Paket eklendi.");
  };

  const handleDeletePackage = async (id: string) => {
    setDeletingId(id);
    const res = await fetch(`/api/coach/packages/${id}`, { method: "DELETE" });
    setDeletingId(null);
    if (!res.ok) {
      notifyError("Paket silinemedi.");
      return;
    }
    setPackages(packages.filter((p) => p.id !== id));
    success("Paket silindi.");
  };

  if (loading) {
    return (
      <div className="flex min-h-[40dvh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-10">
      {/* Header */}
      <div>
        <p className="text-[11px] font-bold uppercase tracking-widest text-blue-600">Koç Paneli</p>
        <h1 className="mt-1 text-2xl font-black text-slate-900 md:text-3xl">Profil & Vitrin</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Bu bilgiler keşfet sayfasında danışanlara gösterilir.
        </p>
      </div>

      {/* Profile Form */}
      <section className="space-y-4 rounded-2xl border bg-card p-5 shadow-sm md:p-6">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-blue-600" />
          <h2 className="text-base font-bold">Vitrin Bilgileri</h2>
        </div>

        {/* Bio */}
        <div className="space-y-1.5">
          <label className="text-sm font-semibold">Hakkımda (Bio)</label>
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            rows={4}
            maxLength={1000}
            placeholder="Antrenman felsefenizi, deneyimlerinizi ve yaklaşımınızı kısaca anlatın..."
            className="w-full rounded-xl border bg-muted/30 px-4 py-3 text-sm leading-relaxed focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          />
          <p className="text-right text-[11px] text-muted-foreground">{bio.length}/1000</p>
        </div>

        {/* Specialties */}
        <div className="space-y-2">
          <label className="text-sm font-semibold">Uzmanlık Alanları</label>
          <div className="flex flex-wrap gap-2">
            {specialties.map((s) => (
              <span
                key={s}
                className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-800"
              >
                {s}
                <button type="button" onClick={() => removeSpecialty(s)} className="ml-1 rounded-full hover:bg-blue-200 p-0.5">
                  <X className="h-3 w-3" />
                </button>
              </span>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              value={specialtyInput}
              onChange={(e) => setSpecialtyInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") { e.preventDefault(); addSpecialty(specialtyInput); }
              }}
              placeholder="Uzmanlık ekle..."
              className="h-9 flex-1 rounded-lg border bg-muted/30 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <Button type="button" size="sm" variant="outline" onClick={() => addSpecialty(specialtyInput)}>
              <Plus className="h-3.5 w-3.5" />
            </Button>
          </div>
          {/* Quick add suggestions */}
          <div className="flex flex-wrap gap-1.5">
            {SPECIALTY_SUGGESTIONS.filter((s) => !specialties.includes(s)).map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => addSpecialty(s)}
                className="inline-flex items-center gap-1 rounded-full border border-dashed px-2.5 py-0.5 text-[11px] font-medium text-muted-foreground hover:border-blue-400 hover:text-blue-700 transition"
              >
                <Tag className="h-2.5 w-2.5" />
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* Experience + Social */}
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <label className="text-sm font-semibold">Tecrübe (Yıl)</label>
            <input
              type="number"
              min={0}
              max={50}
              value={experienceYears}
              onChange={(e) => setExperienceYears(e.target.value)}
              placeholder="örn. 5"
              className="h-10 w-full rounded-xl border bg-muted/30 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-semibold">Sosyal Medya Linki</label>
            <input
              type="url"
              value={socialMediaUrl}
              onChange={(e) => setSocialMediaUrl(e.target.value)}
              placeholder="https://instagram.com/..."
              className="h-10 w-full rounded-xl border bg-muted/30 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <Button onClick={handleSaveProfile} disabled={saving} className="gap-2">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          {saving ? "Kaydediliyor..." : "Profili Kaydet"}
        </Button>
      </section>

      {/* Packages */}
      <section className="space-y-4 rounded-2xl border bg-card p-5 shadow-sm md:p-6">
        <div className="flex items-center gap-2">
          <Briefcase className="h-4 w-4 text-blue-600" />
          <h2 className="text-base font-bold">Eğitim Paketleri</h2>
          <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[11px] font-bold text-blue-700">
            {packages.length}
          </span>
        </div>

        {packages.length === 0 ? (
          <div className="rounded-xl border border-dashed p-6 text-center">
            <p className="text-sm text-muted-foreground">Henüz paket eklemediniz. Paket ekleyerek danışanlarınıza sunabilirsiniz.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {packages.map((pkg) => (
              <div key={pkg.id} className="flex items-start gap-3 rounded-xl border bg-muted/20 p-4">
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm">{pkg.title}</p>
                  {pkg.description && (
                    <p className="mt-0.5 text-xs text-muted-foreground line-clamp-2">{pkg.description}</p>
                  )}
                  {pkg.price != null ? (
                    <span className="mt-1.5 inline-block rounded-full bg-emerald-100 px-2.5 py-0.5 text-[11px] font-bold text-emerald-800">
                      {pkg.price.toLocaleString("tr-TR")} ₺
                    </span>
                  ) : (
                    <span className="mt-1.5 inline-block rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-semibold text-slate-600">
                      Fiyat belirtilmemiş
                    </span>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => handleDeletePackage(pkg.id)}
                  disabled={deletingId === pkg.id}
                  className="rounded-lg p-2 text-muted-foreground hover:bg-red-50 hover:text-red-600 transition"
                >
                  {deletingId === pkg.id
                    ? <Loader2 className="h-4 w-4 animate-spin" />
                    : <Trash2 className="h-4 w-4" />}
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Add package form */}
        <div className="rounded-xl border border-dashed bg-muted/10 p-4 space-y-3">
          <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Yeni Paket Ekle</p>
          <div className="space-y-2">
            <input
              type="text"
              value={pkgTitle}
              onChange={(e) => setPkgTitle(e.target.value)}
              placeholder="Paket başlığı (örn. Aylık Online Koçluk)"
              className="h-10 w-full rounded-xl border bg-background px-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <textarea
              value={pkgDescription}
              onChange={(e) => setPkgDescription(e.target.value)}
              rows={2}
              placeholder="Paket açıklaması (opsiyonel)..."
              className="w-full rounded-xl border bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
            <div className="flex gap-2">
              <div className="relative flex-1">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">₺</span>
                <input
                  type="number"
                  min={0}
                  value={pkgPrice}
                  onChange={(e) => setPkgPrice(e.target.value)}
                  placeholder="Fiyat (boş = fiyat sor)"
                  className="h-10 w-full rounded-xl border bg-background pl-7 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <Button onClick={handleAddPackage} disabled={pkgSaving} className="gap-2 shrink-0">
                {pkgSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                Ekle
              </Button>
            </div>
          </div>
        </div>

        <div className="flex items-start gap-2 rounded-xl bg-blue-50 px-4 py-3 text-xs text-blue-700">
          <ExternalLink className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          <span>Paketlerdeki "İletişime Geç" butonları danışanları doğrudan mesajlaşma ekranına yönlendirir. Ödeme platformda gerçekleşmez.</span>
        </div>
      </section>
    </div>
  );
}

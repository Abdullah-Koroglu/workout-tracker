"use client";

import { useEffect, useState } from "react";
import { Globe, GraduationCap, Award, Clock, HelpCircle, Video, ToggleRight, Save, Loader2, Plus, Trash2 } from "lucide-react";

interface Certification { name: string; issuer?: string; year?: number; url?: string }
interface EducationItem { school: string; degree?: string; year?: number }
interface FAQ { q: string; a: string }

interface ExtendedProfile {
  videoIntroUrl: string | null;
  languages: string[] | null;
  certifications: Certification[] | null;
  education: EducationItem[] | null;
  hourlyRate: number | null;
  responseTimeHours: number | null;
  totalClientsHelped: number | null;
  faqs: FAQ[] | null;
  isAcceptingClients: boolean;
}

const sectionCls = "rounded-2xl bg-white border border-slate-100 p-5 space-y-3";
const inputCls = "h-10 w-full rounded-xl border-0 bg-slate-50 px-3 text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-orange-400";
const headerCls = "flex items-center gap-2 text-sm font-black text-slate-800";

export function ExtendedProfileEditor() {
  const [data, setData] = useState<ExtendedProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedMsg, setSavedMsg] = useState("");

  useEffect(() => {
    fetch("/api/profile")
      .then((r) => r.json())
      .then((d) => {
        const p = d.profile ?? {};
        setData({
          videoIntroUrl: p.videoIntroUrl ?? null,
          languages: Array.isArray(p.languages) ? p.languages : null,
          certifications: Array.isArray(p.certifications) ? p.certifications : null,
          education: Array.isArray(p.education) ? p.education : null,
          hourlyRate: p.hourlyRate ?? null,
          responseTimeHours: p.responseTimeHours ?? null,
          totalClientsHelped: p.totalClientsHelped ?? null,
          faqs: Array.isArray(p.faqs) ? p.faqs : null,
          isAcceptingClients: p.isAcceptingClients ?? true,
        });
      })
      .finally(() => setLoading(false));
  }, []);

  async function save() {
    if (!data) return;
    setSaving(true);
    setSavedMsg("");
    try {
      const res = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          videoIntroUrl: data.videoIntroUrl || null,
          languages: data.languages?.length ? data.languages : null,
          certifications: data.certifications?.length ? data.certifications : null,
          education: data.education?.length ? data.education : null,
          hourlyRate: data.hourlyRate ?? null,
          responseTimeHours: data.responseTimeHours ?? null,
          totalClientsHelped: data.totalClientsHelped ?? null,
          faqs: data.faqs?.length ? data.faqs : null,
          isAcceptingClients: data.isAcceptingClients,
        }),
      });
      if (!res.ok) throw new Error("save failed");
      setSavedMsg("Kaydedildi ✓");
      setTimeout(() => setSavedMsg(""), 2000);
    } catch {
      setSavedMsg("Hata oluştu");
    } finally {
      setSaving(false);
    }
  }

  if (loading || !data) {
    return <div className="h-40 animate-pulse rounded-2xl bg-slate-100" />;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-black text-slate-800">Gelişmiş Profil</h2>
        <button
          onClick={save}
          disabled={saving}
          className="inline-flex items-center gap-1.5 rounded-xl bg-orange-500 px-4 py-2 text-xs font-black text-white hover:bg-orange-600 disabled:opacity-50"
        >
          {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
          {savedMsg || "Kaydet"}
        </button>
      </div>

      {/* Video intro + status */}
      <div className={sectionCls}>
        <div className={headerCls}><Video className="h-4 w-4 text-orange-500" /> Tanıtım Videosu</div>
        <input
          type="url"
          placeholder="https://youtube.com/watch?v=..."
          value={data.videoIntroUrl ?? ""}
          onChange={(e) => setData({ ...data, videoIntroUrl: e.target.value || null })}
          className={inputCls}
        />
        <label className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2.5">
          <span className="flex items-center gap-2 text-sm font-bold text-slate-700">
            <ToggleRight className="h-4 w-4 text-emerald-500" />
            Yeni müşteri kabul ediyorum
          </span>
          <input
            type="checkbox"
            checked={data.isAcceptingClients}
            onChange={(e) => setData({ ...data, isAcceptingClients: e.target.checked })}
            className="h-4 w-4 accent-orange-500"
          />
        </label>
      </div>

      {/* Languages */}
      <div className={sectionCls}>
        <div className={headerCls}><Globe className="h-4 w-4 text-blue-500" /> Diller</div>
        <input
          type="text"
          placeholder="Türkçe, İngilizce (virgülle ayır)"
          value={data.languages?.join(", ") ?? ""}
          onChange={(e) =>
            setData({
              ...data,
              languages: e.target.value.split(",").map((s) => s.trim()).filter(Boolean),
            })
          }
          className={inputCls}
        />
      </div>

      {/* Stats triple */}
      <div className={sectionCls}>
        <div className={headerCls}><Clock className="h-4 w-4 text-purple-500" /> Performans Metrikleri</div>
        <div className="grid grid-cols-3 gap-2">
          <label className="space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wide text-slate-400">Saatlik (₺)</span>
            <input
              type="number"
              value={data.hourlyRate ?? ""}
              onChange={(e) => setData({ ...data, hourlyRate: e.target.value ? parseFloat(e.target.value) : null })}
              className={inputCls}
            />
          </label>
          <label className="space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wide text-slate-400">Yanıt (saat)</span>
            <input
              type="number"
              value={data.responseTimeHours ?? ""}
              onChange={(e) => setData({ ...data, responseTimeHours: e.target.value ? parseInt(e.target.value) : null })}
              className={inputCls}
            />
          </label>
          <label className="space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wide text-slate-400">Toplam Danışan</span>
            <input
              type="number"
              value={data.totalClientsHelped ?? ""}
              onChange={(e) => setData({ ...data, totalClientsHelped: e.target.value ? parseInt(e.target.value) : null })}
              className={inputCls}
            />
          </label>
        </div>
      </div>

      {/* Certifications */}
      <div className={sectionCls}>
        <div className="flex items-center justify-between">
          <div className={headerCls}><Award className="h-4 w-4 text-amber-500" /> Sertifikalar</div>
          <button
            type="button"
            onClick={() => setData({ ...data, certifications: [...(data.certifications ?? []), { name: "" }] })}
            className="inline-flex items-center gap-1 rounded-lg bg-slate-100 px-2 py-1 text-xs font-bold text-slate-600 hover:bg-slate-200"
          >
            <Plus className="h-3 w-3" /> Ekle
          </button>
        </div>
        {(data.certifications ?? []).map((c, i) => (
          <div key={i} className="grid grid-cols-12 gap-2">
            <input
              placeholder="Sertifika adı"
              value={c.name}
              onChange={(e) => {
                const arr = [...(data.certifications ?? [])];
                arr[i] = { ...arr[i], name: e.target.value };
                setData({ ...data, certifications: arr });
              }}
              className={`${inputCls} col-span-5`}
            />
            <input
              placeholder="Veren kurum"
              value={c.issuer ?? ""}
              onChange={(e) => {
                const arr = [...(data.certifications ?? [])];
                arr[i] = { ...arr[i], issuer: e.target.value };
                setData({ ...data, certifications: arr });
              }}
              className={`${inputCls} col-span-4`}
            />
            <input
              type="number"
              placeholder="Yıl"
              value={c.year ?? ""}
              onChange={(e) => {
                const arr = [...(data.certifications ?? [])];
                arr[i] = { ...arr[i], year: e.target.value ? parseInt(e.target.value) : undefined };
                setData({ ...data, certifications: arr });
              }}
              className={`${inputCls} col-span-2`}
            />
            <button
              type="button"
              onClick={() => {
                const arr = [...(data.certifications ?? [])];
                arr.splice(i, 1);
                setData({ ...data, certifications: arr });
              }}
              className="col-span-1 inline-flex items-center justify-center rounded-xl bg-rose-50 text-rose-500 hover:bg-rose-100"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>

      {/* Education */}
      <div className={sectionCls}>
        <div className="flex items-center justify-between">
          <div className={headerCls}><GraduationCap className="h-4 w-4 text-emerald-500" /> Eğitim</div>
          <button
            type="button"
            onClick={() => setData({ ...data, education: [...(data.education ?? []), { school: "" }] })}
            className="inline-flex items-center gap-1 rounded-lg bg-slate-100 px-2 py-1 text-xs font-bold text-slate-600 hover:bg-slate-200"
          >
            <Plus className="h-3 w-3" /> Ekle
          </button>
        </div>
        {(data.education ?? []).map((ed, i) => (
          <div key={i} className="grid grid-cols-12 gap-2">
            <input
              placeholder="Okul / Üniversite"
              value={ed.school}
              onChange={(e) => {
                const arr = [...(data.education ?? [])];
                arr[i] = { ...arr[i], school: e.target.value };
                setData({ ...data, education: arr });
              }}
              className={`${inputCls} col-span-5`}
            />
            <input
              placeholder="Derece"
              value={ed.degree ?? ""}
              onChange={(e) => {
                const arr = [...(data.education ?? [])];
                arr[i] = { ...arr[i], degree: e.target.value };
                setData({ ...data, education: arr });
              }}
              className={`${inputCls} col-span-4`}
            />
            <input
              type="number"
              placeholder="Yıl"
              value={ed.year ?? ""}
              onChange={(e) => {
                const arr = [...(data.education ?? [])];
                arr[i] = { ...arr[i], year: e.target.value ? parseInt(e.target.value) : undefined };
                setData({ ...data, education: arr });
              }}
              className={`${inputCls} col-span-2`}
            />
            <button
              type="button"
              onClick={() => {
                const arr = [...(data.education ?? [])];
                arr.splice(i, 1);
                setData({ ...data, education: arr });
              }}
              className="col-span-1 inline-flex items-center justify-center rounded-xl bg-rose-50 text-rose-500 hover:bg-rose-100"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>

      {/* FAQs */}
      <div className={sectionCls}>
        <div className="flex items-center justify-between">
          <div className={headerCls}><HelpCircle className="h-4 w-4 text-pink-500" /> SSS</div>
          <button
            type="button"
            onClick={() => setData({ ...data, faqs: [...(data.faqs ?? []), { q: "", a: "" }] })}
            className="inline-flex items-center gap-1 rounded-lg bg-slate-100 px-2 py-1 text-xs font-bold text-slate-600 hover:bg-slate-200"
          >
            <Plus className="h-3 w-3" /> Ekle
          </button>
        </div>
        {(data.faqs ?? []).map((f, i) => (
          <div key={i} className="space-y-1.5 rounded-xl bg-slate-50 p-3">
            <input
              placeholder="Soru"
              value={f.q}
              onChange={(e) => {
                const arr = [...(data.faqs ?? [])];
                arr[i] = { ...arr[i], q: e.target.value };
                setData({ ...data, faqs: arr });
              }}
              className="h-9 w-full rounded-lg border-0 bg-white px-3 text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-pink-400"
            />
            <textarea
              placeholder="Cevap"
              rows={2}
              value={f.a}
              onChange={(e) => {
                const arr = [...(data.faqs ?? [])];
                arr[i] = { ...arr[i], a: e.target.value };
                setData({ ...data, faqs: arr });
              }}
              className="w-full rounded-lg border-0 bg-white px-3 py-2 text-sm text-slate-600 focus:outline-none focus:ring-2 focus:ring-pink-400 resize-none"
            />
            <button
              type="button"
              onClick={() => {
                const arr = [...(data.faqs ?? [])];
                arr.splice(i, 1);
                setData({ ...data, faqs: arr });
              }}
              className="inline-flex items-center gap-1 text-xs text-rose-500 hover:text-rose-600"
            >
              <Trash2 className="h-3 w-3" /> Sil
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

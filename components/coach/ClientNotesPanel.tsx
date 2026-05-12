"use client";

import { useEffect, useState } from "react";
import { FileText, Plus, Save, Loader2, X, Tag } from "lucide-react";

interface Props {
  clientId: string;
  clientName: string;
}

export function ClientNotesPanel({ clientId, clientName }: Props) {
  const [notes, setNotes] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    fetch(`/api/coach/clients/${clientId}/notes`)
      .then((r) => r.json())
      .then((d) => {
        setNotes(d.notes ?? "");
        setTags(Array.isArray(d.tags) ? d.tags : []);
      })
      .finally(() => setLoading(false));
  }, [clientId, open]);

  function addTag() {
    const t = tagInput.trim();
    if (t && !tags.includes(t)) {
      setTags((prev) => [...prev, t]);
    }
    setTagInput("");
  }

  function removeTag(tag: string) {
    setTags((prev) => prev.filter((t) => t !== tag));
  }

  async function save() {
    setSaving(true);
    try {
      await fetch(`/api/coach/clients/${clientId}/notes`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes, tags }),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-colors"
        style={{
          background: open ? "rgba(249,115,22,0.12)" : "#F8FAFC",
          color: open ? "#EA580C" : "#64748B",
          border: "1px solid",
          borderColor: open ? "rgba(249,115,22,0.3)" : "#E2E8F0",
        }}
      >
        <FileText className="h-3.5 w-3.5" />
        Notlar
      </button>

      {open && (
        <div
          className="mt-3 rounded-xl border border-slate-100 bg-white p-4 space-y-3"
          style={{ boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}
        >
          <p className="text-[11px] font-black uppercase tracking-wider text-slate-400">
            {clientName} — Notlar
          </p>

          {loading ? (
            <div className="h-20 animate-pulse rounded-lg bg-slate-100" />
          ) : (
            <>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={4}
                maxLength={5000}
                placeholder={`${clientName} hakkında notlar ekleyin...`}
                className="w-full resize-none rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100 transition-all"
              />

              {/* Tags */}
              <div>
                <p className="mb-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  <Tag className="mr-1 inline h-3 w-3" />Etiketler
                </p>
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {tags.map((tag) => (
                    <span
                      key={tag}
                      className="flex items-center gap-1 rounded-full bg-orange-50 px-2.5 py-0.5 text-[11px] font-bold text-orange-700 border border-orange-200"
                    >
                      {tag}
                      <button onClick={() => removeTag(tag)} className="text-orange-400 hover:text-orange-700">
                        <X className="h-2.5 w-2.5" />
                      </button>
                    </span>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addTag())}
                    placeholder="Etiket ekle..."
                    maxLength={50}
                    className="flex-1 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs outline-none focus:border-orange-400"
                  />
                  <button
                    onClick={addTag}
                    className="flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-bold text-white"
                    style={{ background: "linear-gradient(135deg, #FB923C, #EA580C)" }}
                  >
                    <Plus className="h-3 w-3" />
                  </button>
                </div>
              </div>

              <button
                onClick={save}
                disabled={saving}
                className="flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-black text-white transition-opacity hover:opacity-90 disabled:opacity-50"
                style={{ background: saved ? "#16A34A" : "linear-gradient(135deg, #1A365D, #2D4A7A)" }}
              >
                {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                {saved ? "Kaydedildi!" : "Kaydet"}
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}

"use client";

import { useState } from "react";
import { Loader2, Megaphone, Send, X } from "lucide-react";

type Client = { id: string; name: string };

type Props = {
  clients: Client[];
};

export function BroadcastModal({ clients }: Props) {
  const [open, setOpen] = useState(false);
  const [content, setContent] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  const allSelected = selectedIds.size === clients.length;

  const toggleAll = () => {
    if (allSelected) setSelectedIds(new Set());
    else setSelectedIds(new Set(clients.map((c) => c.id)));
  };

  const toggle = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const send = async () => {
    if (!content.trim()) return;
    setSending(true);
    setResult(null);
    const res = await fetch("/api/coach/broadcast", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        content,
        clientIds: selectedIds.size > 0 ? Array.from(selectedIds) : undefined,
      }),
    });
    const data = await res.json();
    setSending(false);
    if (res.ok) {
      setResult(`✓ ${data.sent} danışana gönderildi.`);
      setContent("");
      setSelectedIds(new Set());
      setTimeout(() => { setOpen(false); setResult(null); }, 2000);
    } else {
      setResult(`Hata: ${data.error ?? "Bilinmeyen hata"}`);
    }
  };

  return (
    <>
      <button
        onClick={() => { setOpen(true); setSelectedIds(new Set(clients.map((c) => c.id))); }}
        className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-black text-white transition hover:opacity-90"
        style={{ background: "linear-gradient(135deg, #1A365D, #2D4A7A)" }}
      >
        <Megaphone className="h-4 w-4" />
        Duyuru Yap
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 md:items-center">
          <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
              <div className="flex items-center gap-2">
                <Megaphone className="h-5 w-5 text-slate-700" />
                <h2 className="font-black text-slate-800">Toplu Duyuru</h2>
              </div>
              <button onClick={() => setOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Client selector */}
            <div className="px-5 pt-4">
              <div className="mb-2 flex items-center justify-between">
                <p className="text-xs font-black uppercase tracking-wider text-slate-400">Alıcılar</p>
                <button onClick={toggleAll} className="text-xs font-bold text-blue-500 hover:underline">
                  {allSelected ? "Seçimi Kaldır" : "Tümünü Seç"}
                </button>
              </div>
              <div className="flex max-h-36 flex-wrap gap-1.5 overflow-y-auto">
                {clients.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => toggle(c.id)}
                    className="rounded-full px-3 py-1 text-xs font-bold transition"
                    style={
                      selectedIds.has(c.id)
                        ? { background: "#1A365D", color: "#fff" }
                        : { background: "#F1F5F9", color: "#64748B" }
                    }
                  >
                    {c.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Message */}
            <div className="px-5 pt-4">
              <p className="mb-1.5 text-xs font-black uppercase tracking-wider text-slate-400">Mesaj</p>
              <textarea
                rows={4}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Duyurunuzu yazın..."
                className="w-full resize-none rounded-xl bg-slate-50 px-4 py-3 text-sm text-slate-800 placeholder-slate-400 ring-1 ring-black/8 focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
              <p className="mt-1 text-right text-xs text-slate-400">{content.length}/1000</p>
            </div>

            {result && (
              <div className={`mx-5 mt-2 rounded-xl px-4 py-2.5 text-sm font-bold ${result.startsWith("✓") ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>
                {result}
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-2 px-5 py-4">
              <button
                onClick={() => setOpen(false)}
                className="flex-1 rounded-xl bg-slate-100 py-2.5 text-sm font-black text-slate-600 hover:bg-slate-200"
              >
                İptal
              </button>
              <button
                onClick={send}
                disabled={sending || !content.trim() || selectedIds.size === 0}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-black text-white transition hover:opacity-90 disabled:opacity-50"
                style={{ background: "linear-gradient(135deg, #1A365D, #2D4A7A)" }}
              >
                {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                {sending ? "Gönderiliyor..." : `Gönder (${selectedIds.size})`}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

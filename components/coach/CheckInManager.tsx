"use client";

import { useEffect, useState } from "react";
import { ClipboardList, ChevronDown, ChevronUp, Loader2, Send, X } from "lucide-react";

type Client = { id: string; name: string };
type CheckInWithResponse = {
  id: string;
  clientId: string;
  message: string | null;
  createdAt: string;
  client: { id: string; name: string };
  response: {
    sleepScore: number;
    stressScore: number;
    motivationScore: number;
    notes: string | null;
    createdAt: string;
  } | null;
};

const SCORE_LABELS = ["", "Çok Kötü", "Kötü", "Orta", "İyi", "Çok İyi"];
const scoreColor = (s: number) =>
  s <= 2 ? "#EF4444" : s === 3 ? "#F59E0B" : "#22C55E";

function ScoreBadge({ score, label }: { score: number; label: string }) {
  return (
    <div className="flex flex-col items-center gap-0.5">
      <span
        className="flex h-8 w-8 items-center justify-center rounded-full text-sm font-black text-white"
        style={{ background: scoreColor(score) }}
      >
        {score}
      </span>
      <span className="text-[10px] text-slate-400">{label}</span>
    </div>
  );
}

type Props = { clients: Client[] };

export function CheckInManager({ clients }: Props) {
  const [open, setOpen] = useState(false);
  const [sendOpen, setSendOpen] = useState(false);
  const [checkIns, setCheckIns] = useState<CheckInWithResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  const fetchCheckIns = () => {
    setLoading(true);
    fetch("/api/coach/checkins")
      .then((r) => r.json())
      .then((d) => setCheckIns(d.checkIns ?? []))
      .finally(() => setLoading(false));
  };

  useEffect(() => { if (open) fetchCheckIns(); }, [open]);

  const toggle = (id: string) =>
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  const sendCheckIn = async () => {
    if (selectedIds.size === 0) return;
    setSending(true);
    setResult(null);
    const res = await fetch("/api/coach/checkins", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ clientIds: Array.from(selectedIds), message: message || undefined }),
    });
    const data = await res.json();
    setSending(false);
    if (res.ok) {
      setResult(`✓ ${data.sent} danışana gönderildi.`);
      setSelectedIds(new Set());
      setMessage("");
      setTimeout(() => { setSendOpen(false); setResult(null); fetchCheckIns(); }, 1500);
    } else {
      setResult(`Hata: ${data.error}`);
    }
  };

  const pending = checkIns.filter((c) => !c.response);
  const answered = checkIns.filter((c) => c.response);

  return (
    <div
      className="rounded-[18px] bg-white shadow-sm"
      style={{ border: "1px solid rgba(0,0,0,0.06)" }}
    >
      {/* Header row */}
      <button
        onClick={() => setOpen((p) => !p)}
        className="flex w-full items-center justify-between px-4 py-3.5"
      >
        <div className="flex items-center gap-2">
          <ClipboardList className="h-4 w-4 text-slate-500" />
          <span className="text-[14px] font-black text-slate-800">Check-in Formları</span>
          {pending.length > 0 && (
            <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[11px] font-black text-blue-700">
              {pending.length} bekliyor
            </span>
          )}
        </div>
        {open ? <ChevronUp className="h-4 w-4 text-slate-400" /> : <ChevronDown className="h-4 w-4 text-slate-400" />}
      </button>

      {open && (
        <div className="border-t border-slate-100 px-4 pb-4">
          {/* Send button */}
          <div className="mt-3 flex justify-end">
            <button
              onClick={() => setSendOpen(true)}
              className="flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-black text-white transition hover:opacity-90"
              style={{ background: "#1A365D" }}
            >
              <Send className="h-3.5 w-3.5" />
              Check-in Gönder
            </button>
          </div>

          {loading ? (
            <div className="flex h-12 items-center justify-center">
              <Loader2 className="h-4 w-4 animate-spin text-slate-400" />
            </div>
          ) : checkIns.length === 0 ? (
            <p className="mt-4 text-center text-sm text-slate-400">Henüz check-in gönderilmedi.</p>
          ) : (
            <div className="mt-3 space-y-2">
              {/* Pending */}
              {pending.length > 0 && (
                <div>
                  <p className="mb-1.5 text-[11px] font-black uppercase tracking-wider text-slate-400">Yanıt Bekliyor</p>
                  {pending.map((ci) => (
                    <div key={ci.id} className="mb-1.5 flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2">
                      <p className="text-sm font-bold text-slate-700">{ci.client.name}</p>
                      <p className="text-xs text-slate-400">
                        {new Date(ci.createdAt).toLocaleDateString("tr-TR")}
                      </p>
                    </div>
                  ))}
                </div>
              )}

              {/* Answered */}
              {answered.length > 0 && (
                <div>
                  <p className="mb-1.5 mt-3 text-[11px] font-black uppercase tracking-wider text-slate-400">Yanıtlananlar</p>
                  {answered.map((ci) => (
                    <div key={ci.id} className="mb-2 rounded-xl bg-slate-50 px-3 py-3">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-bold text-slate-700">{ci.client.name}</p>
                        <p className="text-xs text-slate-400">
                          {new Date(ci.response!.createdAt).toLocaleDateString("tr-TR")}
                        </p>
                      </div>
                      <div className="mt-2.5 flex gap-4">
                        <ScoreBadge score={ci.response!.sleepScore} label="Uyku" />
                        <ScoreBadge score={ci.response!.stressScore} label="Stres" />
                        <ScoreBadge score={ci.response!.motivationScore} label="Motivasyon" />
                      </div>
                      {ci.response!.notes && (
                        <p className="mt-2 text-xs italic text-slate-500">"{ci.response!.notes}"</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Send modal */}
      {sendOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 md:items-center">
          <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
              <h2 className="font-black text-slate-800">Check-in Gönder</h2>
              <button onClick={() => setSendOpen(false)}><X className="h-5 w-5 text-slate-400" /></button>
            </div>

            <div className="px-5 pt-4">
              <p className="mb-2 text-xs font-black uppercase tracking-wider text-slate-400">Danışan Seç</p>
              <div className="flex max-h-32 flex-wrap gap-1.5 overflow-y-auto">
                {clients.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => toggle(c.id)}
                    className="rounded-full px-3 py-1 text-xs font-bold transition"
                    style={selectedIds.has(c.id) ? { background: "#1A365D", color: "#fff" } : { background: "#F1F5F9", color: "#64748B" }}
                  >
                    {c.name}
                  </button>
                ))}
              </div>
            </div>

            <div className="px-5 pt-3">
              <p className="mb-1.5 text-xs font-black uppercase tracking-wider text-slate-400">Ek Mesaj (opsiyonel)</p>
              <textarea
                rows={3}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Bu haftanın check-in'i..."
                className="w-full resize-none rounded-xl bg-slate-50 px-3 py-2.5 text-sm text-slate-700 ring-1 ring-black/8 focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
            </div>

            {result && (
              <p className={`mx-5 mt-2 text-sm font-bold ${result.startsWith("✓") ? "text-green-600" : "text-red-500"}`}>
                {result}
              </p>
            )}

            <div className="flex gap-2 px-5 py-4">
              <button onClick={() => setSendOpen(false)} className="flex-1 rounded-xl bg-slate-100 py-2.5 text-sm font-black text-slate-600">İptal</button>
              <button
                onClick={sendCheckIn}
                disabled={sending || selectedIds.size === 0}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-black text-white disabled:opacity-50"
                style={{ background: "#1A365D" }}
              >
                {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : `Gönder (${selectedIds.size})`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

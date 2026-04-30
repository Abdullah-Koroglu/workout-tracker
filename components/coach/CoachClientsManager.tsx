"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { MessageCircle, Check, X, ChevronRight, Search, Info } from "lucide-react";

import { useConfirmation } from "@/contexts/ConfirmationContext";
import { useNotificationContext } from "@/contexts/NotificationContext";

type ClientRelationItem = {
  id: string;
  relationId: string;
  name: string;
  email: string;
  status: "PENDING" | "ACCEPTED" | "REJECTED";
  compliance?: number;
};

function complianceColor(score: number): string {
  if (score >= 80) return "#22C55E";
  if (score >= 50) return "#F59E0B";
  return "#EF4444";
}

function complianceLabel(score: number): string {
  if (score >= 80) return "İyi";
  if (score >= 50) return "Orta";
  return "Düşük";
}

function ComplianceBadge({ score }: { score: number }) {
  const [tip, setTip] = useState(false);
  const color = complianceColor(score);
  const label = complianceLabel(score);

  return (
    <div className="relative flex items-center gap-1.5">
      {/* Color ring badge */}
      <div
        className="flex h-7 items-center gap-1 rounded-full px-2 text-[11px] font-black text-white"
        style={{ background: color }}
      >
        %{score}
        <span className="font-normal opacity-80">· {label}</span>
      </div>

      {/* Tooltip trigger */}
      <button
        type="button"
        onMouseEnter={() => setTip(true)}
        onMouseLeave={() => setTip(false)}
        onFocus={() => setTip(true)}
        onBlur={() => setTip(false)}
        className="text-slate-300 hover:text-slate-400 focus:outline-none"
      >
        <Info className="h-3.5 w-3.5" />
      </button>

      {tip && (
        <div
          className="absolute bottom-full left-0 z-20 mb-2 w-56 rounded-xl px-3 py-2.5 text-[12px] leading-relaxed text-white shadow-lg"
          style={{ background: "#1E293B" }}
        >
          <p className="font-black mb-0.5">Sadakat Skoru</p>
          <p className="text-white/70">
            Son 30 günde tamamlanan / atanan antrenman oranı. Atlanmış
            kardiyo setleri için ek ceza uygulanır.
          </p>
          <p className="mt-1 font-bold" style={{ color }}>
            {score >= 80
              ? "Danışan düzenli antrenman yapıyor."
              : score >= 50
              ? "Dikkat: Bazı antrenmanlar atlanıyor."
              : "Risk: Danışan antrenmanları sıklıkla atıyor."}
          </p>
        </div>
      )}
    </div>
  );
}

function ComplianceRing({ name, score, size = 44 }: { name: string; score?: number; size?: number }) {
  const initials = name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
  const ringColor = score !== undefined ? complianceColor(score) : "#1A365D";
  const circumference = 2 * Math.PI * 20;
  const dashOffset = score !== undefined ? circumference * (1 - score / 100) : circumference;

  return (
    <div className="relative flex-shrink-0" style={{ width: size, height: size }}>
      {score !== undefined && (
        <svg
          className="absolute inset-0"
          width={size}
          height={size}
          viewBox="0 0 48 48"
          style={{ transform: "rotate(-90deg)" }}
        >
          <circle cx="24" cy="24" r="20" fill="none" stroke="#F1F5F9" strokeWidth="3.5" />
          <circle
            cx="24"
            cy="24"
            r="20"
            fill="none"
            stroke={ringColor}
            strokeWidth="3.5"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={dashOffset}
            style={{ transition: "stroke-dashoffset 0.6s ease" }}
          />
        </svg>
      )}
      <div
        className="absolute inset-[4px] flex items-center justify-center rounded-full text-white font-bold"
        style={{
          fontSize: (size - 8) * 0.36,
          background: `linear-gradient(135deg, #1A365D, #2D4A7ACC)`,
          boxShadow: "0 2px 8px #1A365D44",
        }}
      >
        {initials}
      </div>
    </div>
  );
}


function MetricCard({
  label,
  value,
  accent,
  suffix,
}: {
  label: string;
  value: number;
  accent: string;
  suffix?: string;
}) {
  return (
    <div
      className="flex-1 rounded-[18px] p-3.5"
      style={{
        background: `linear-gradient(135deg, ${accent}18, ${accent}08)`,
        boxShadow: "0 2px 16px rgba(0,0,0,0.07), 0 1px 3px rgba(0,0,0,0.04)",
        border: `1px solid rgba(0,0,0,0.06)`,
        borderLeftColor: accent,
        borderLeftWidth: 3,
      }}
    >
      <div className="text-[10px] font-bold uppercase tracking-wide" style={{ color: "#94A3B8" }}>
        {label}
      </div>
      <div className="text-[26px] font-black leading-tight mt-0.5 flex items-baseline gap-0.5" style={{ color: accent }}>
        {value}{suffix && <span className="text-[16px]">{suffix}</span>}
      </div>
    </div>
  );
}

export function CoachClientsManager({
  accepted,
  pending,
}: {
  accepted: ClientRelationItem[];
  pending: ClientRelationItem[];
}) {
  const router = useRouter();
  const { push } = useNotificationContext();
  const { confirm } = useConfirmation();
  const [activeClientId, setActiveClientId] = useState<string | null>(null);
  const [tab, setTab] = useState<"accepted" | "pending">("accepted");
  const [query, setQuery] = useState("");

  const updateRelation = async (
    clientId: string,
    status: "ACCEPTED" | "REJECTED"
  ) => {
    setActiveClientId(clientId);
    const response = await fetch(`/api/coach/clients/${clientId}/relation`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    setActiveClientId(null);
    if (!response.ok) { push("İstek güncellenemedi."); return; }
    push(status === "ACCEPTED" ? "Danışan isteği kabul edildi." : "Danışan isteği reddedildi.");
    router.refresh();
  };

  const removeClient = async (clientId: string) => {
    const approved = await confirm({
      title: "Bağlantıyı kaldır",
      description: "Bu danışan ile ilişkiyi kaldırmak istediğinize emin misiniz?",
      confirmText: "Kaldır",
      cancelText: "Vazgeç",
      danger: true,
    });
    if (!approved) return;
    setActiveClientId(clientId);
    const response = await fetch(`/api/coach/clients/${clientId}/relation`, { method: "DELETE" });
    const data = await response.json().catch(() => ({}));
    setActiveClientId(null);
    if (!response.ok) { push(data.error || "Danışan bağlantısı kaldırılamadı."); return; }
    push("Danışan bağlantısı kaldırıldı.");
    router.refresh();
  };

  const filterList = (list: ClientRelationItem[]) => {
    const q = query.trim().toLowerCase();
    if (!q) return list;
    return list.filter(
      (c) =>
        c.name.toLowerCase().includes(q) || c.email.toLowerCase().includes(q)
    );
  };

  const acceptedFiltered = filterList(accepted).sort((a, b) => {
    // Null (no data) last, then ascending score so lowest compliance appears first
    if (a.compliance === undefined && b.compliance === undefined) return 0;
    if (a.compliance === undefined) return 1;
    if (b.compliance === undefined) return -1;
    return a.compliance - b.compliance;
  });
  const pendingFiltered = filterList(pending);
  const list = tab === "accepted" ? acceptedFiltered : pendingFiltered;

  return (
    <div className="flex flex-col gap-3.5">
      {/* Metric Cards */}
      {(() => {
        const withScore = accepted.filter((c) => c.compliance !== undefined);
        const avgCompliance =
          withScore.length > 0
            ? Math.round(withScore.reduce((s, c) => s + (c.compliance ?? 0), 0) / withScore.length)
            : null;
        return (
          <div className="flex gap-2.5">
            <MetricCard label="Toplam" value={accepted.length + pending.length} accent="#1E293B" />
            <MetricCard label="Aktif" value={accepted.length} accent="#22C55E" />
            <MetricCard
              label="Ort. Sadakat"
              value={avgCompliance ?? 0}
              suffix="%"
              accent={avgCompliance !== null ? complianceColor(avgCompliance) : "#94A3B8"}
            />
          </div>
        );
      })()}

      {/* Search */}
      <div
        className="flex items-center gap-2 rounded-xl px-3"
        style={{
          background: "#F1F5F9",
          height: 44,
          border: "1.5px solid #E2E8F0",
        }}
      >
        <Search className="w-4 h-4 flex-shrink-0" style={{ color: "#94A3B8" }} />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Danışan adı veya e-posta ara..."
          className="flex-1 bg-transparent text-sm outline-none"
          style={{ color: "#1E293B" }}
        />
      </div>

      {/* Tab Bar */}
      <div
        className="flex rounded-xl p-1 gap-1"
        style={{ background: "#F1F5F9" }}
      >
        {[
          { key: "accepted" as const, label: `Aktif (${accepted.length})` },
          { key: "pending" as const, label: `Bekleyen (${pending.length})` },
        ].map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className="flex-1 py-2 rounded-[10px] text-[13px] font-semibold transition-all"
            style={{
              background: tab === t.key ? "#fff" : "transparent",
              color: tab === t.key ? "#1E293B" : "#94A3B8",
              boxShadow: tab === t.key ? "0 1px 4px rgba(0,0,0,0.08)" : "none",
              border: "none",
              cursor: "pointer",
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Client List */}
      <div className="flex flex-col gap-2.5">
        {list.length === 0 ? (
          <div
            className="rounded-[18px] p-8 text-center text-sm"
            style={{ background: "#F8FAFC", color: "#94A3B8", border: "1px solid rgba(0,0,0,0.06)" }}
          >
            {tab === "accepted" ? "Aktif danışan bulunamadı." : "Bekleyen istek yok."}
          </div>
        ) : tab === "accepted" ? (
          list.map((client) => (
            <div
              key={client.relationId}
              onClick={() => router.push(`/coach/clients/${client.id}`)}
              className="rounded-[18px] p-4 cursor-pointer"
              style={{
                background: "#fff",
                boxShadow: "0 2px 16px rgba(0,0,0,0.07), 0 1px 3px rgba(0,0,0,0.04)",
                border: "1px solid rgba(0,0,0,0.06)",
              }}
            >
              <div className="flex items-center gap-3">
                <ComplianceRing name={client.name} score={client.compliance} size={44} />
                <div className="flex-1 min-w-0">
                  <div className="text-[15px] font-bold truncate" style={{ color: "#1E293B" }}>
                    {client.name}
                  </div>
                  <div className="text-xs truncate mt-0.5" style={{ color: "#94A3B8" }}>
                    {client.email}
                  </div>
                  {client.compliance !== undefined && (
                    <div className="mt-1.5" onClick={(e) => e.stopPropagation()}>
                      <ComplianceBadge score={client.compliance} />
                    </div>
                  )}
                  {client.compliance === undefined && (
                    <span className="mt-1 inline-block text-[11px] text-slate-400">
                      Henüz antrenman yok
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <button
                    onClick={(e) => { e.stopPropagation(); router.push("/coach/messages"); }}
                    className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors"
                    style={{ background: "#2563EB15", color: "#2563EB" }}
                    title="Mesaj gönder"
                  >
                    <MessageCircle className="w-4 h-4" />
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); void removeClient(client.id); }}
                    disabled={activeClientId === client.id}
                    className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors"
                    style={{ background: "#F1F5F9", color: "#94A3B8" }}
                    title="Kaldır"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                  <ChevronRight className="w-4 h-4" style={{ color: "#CBD5E1" }} />
                </div>
              </div>
            </div>
          ))
        ) : (
          list.map((client) => (
            <div
              key={client.relationId}
              className="rounded-[18px] p-4"
              style={{
                background: "#fff",
                boxShadow: "0 2px 16px rgba(0,0,0,0.07), 0 1px 3px rgba(0,0,0,0.04)",
                border: "1px solid rgba(0,0,0,0.06)",
              }}
            >
              <div className="flex items-center gap-3">
                <ClientAvatar name={client.name} size={44} />
                <div className="flex-1 min-w-0">
                  <div className="text-[15px] font-bold truncate" style={{ color: "#1E293B" }}>
                    {client.name}
                  </div>
                  <div className="text-xs truncate mt-0.5" style={{ color: "#94A3B8" }}>
                    {client.email}
                  </div>
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  <button
                    onClick={() => updateRelation(client.id, "ACCEPTED")}
                    disabled={activeClientId === client.id}
                    className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors disabled:opacity-50"
                    style={{ background: "#22C55E15", color: "#22C55E" }}
                    title="Kabul et"
                  >
                    <Check className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => updateRelation(client.id, "REJECTED")}
                    disabled={activeClientId === client.id}
                    className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors disabled:opacity-50"
                    style={{ background: "#EF444415", color: "#EF4444" }}
                    title="Reddet"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

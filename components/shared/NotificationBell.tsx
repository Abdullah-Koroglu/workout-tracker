"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Bell, BellDot, Check, CheckCheck, X } from "lucide-react";

type Notification = {
  id: string;
  title: string;
  body: string;
  type: string;
  isRead: boolean;
  createdAt: string;
};

const TYPE_ICON: Record<string, string> = {
  NEW_ASSIGNMENT:        "📋",
  COACH_ACCEPTED:        "✅",
  COACH_REJECTED:        "❌",
  NEW_CONNECTION_REQUEST:"🤝",
  DIRECT_MESSAGE:        "💬",
};

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "Az önce";
  if (m < 60) return `${m} dk önce`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} sa önce`;
  return `${Math.floor(h / 24)} gün önce`;
}

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const panelRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await fetch("/api/notifications");
      if (!res.ok) return;
      const data = await res.json();
      setNotifications(data.notifications ?? []);
      setUnreadCount(data.unreadCount ?? 0);
    } catch { /* silent */ }
  }, []);

  // Initial fetch + 30s polling
  useEffect(() => {
    void fetchNotifications();
    const id = setInterval(() => void fetchNotifications(), 30000);
    return () => clearInterval(id);
  }, [fetchNotifications]);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (
        panelRef.current && !panelRef.current.contains(e.target as Node) &&
        buttonRef.current && !buttonRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const handleOpen = async () => {
    setOpen((v) => !v);
    if (!open && unreadCount > 0) {
      // Mark all as read when opening
      try {
        await fetch("/api/notifications", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({}) });
        setUnreadCount(0);
        setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      } catch { /* silent */ }
    }
  };

  const markOne = async (id: string) => {
    try {
      await fetch("/api/notifications", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) });
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      );
    } catch { /* silent */ }
  };

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        type="button"
        onClick={handleOpen}
        className="relative flex h-9 w-9 items-center justify-center rounded-lg text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800/60 dark:hover:text-slate-100"
        title="Bildirimler"
      >
        {unreadCount > 0 ? (
          <BellDot className="h-5 w-5" style={{ color: "#F97316" }} />
        ) : (
          <Bell className="h-5 w-5" />
        )}
        {unreadCount > 0 && (
          <span
            className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full text-[10px] font-black text-white"
            style={{ background: "#F97316", minWidth: 16 }}
          >
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div
          ref={panelRef}
          className="absolute right-0 top-full mt-2 w-80 overflow-hidden rounded-2xl"
          style={{
            background: "#fff",
            boxShadow: "0 8px 32px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.06)",
            border: "1px solid rgba(0,0,0,0.06)",
            zIndex: 999,
          }}
        >
          {/* Header */}
          <div
            className="flex items-center justify-between px-4 py-3"
            style={{ borderBottom: "1px solid #F1F5F9" }}
          >
            <div className="flex items-center gap-2">
              <Bell className="h-4 w-4" style={{ color: "#F97316" }} />
              <span className="text-[14px] font-black" style={{ color: "#1E293B" }}>
                Bildirimler
              </span>
              {unreadCount > 0 && (
                <span
                  className="rounded-full px-1.5 py-0.5 text-[10px] font-black text-white"
                  style={{ background: "#F97316" }}
                >
                  {unreadCount}
                </span>
              )}
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="flex h-6 w-6 items-center justify-center rounded-lg transition-colors hover:bg-slate-100"
            >
              <X className="h-3.5 w-3.5" style={{ color: "#94A3B8" }} />
            </button>
          </div>

          {/* List */}
          <div className="max-h-[360px] overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="flex flex-col items-center py-10">
                <Bell className="h-8 w-8 mb-2" style={{ color: "#CBD5E1" }} />
                <p className="text-[13px]" style={{ color: "#94A3B8" }}>
                  Henüz bildirim yok
                </p>
              </div>
            ) : (
              notifications.map((n) => (
                <div
                  key={n.id}
                  className="flex items-start gap-3 px-4 py-3 transition-colors"
                  style={{
                    background: n.isRead ? "#fff" : "#FFF7ED",
                    borderBottom: "1px solid #F8FAFC",
                    cursor: "default",
                  }}
                >
                  <div
                    className="mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-xl text-base"
                    style={{ background: n.isRead ? "#F1F5F9" : "#FED7AA" }}
                  >
                    {TYPE_ICON[n.type] ?? "🔔"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p
                      className="text-[13px] font-bold leading-snug truncate"
                      style={{ color: "#1E293B" }}
                    >
                      {n.title}
                    </p>
                    <p
                      className="text-[12px] mt-0.5 leading-relaxed"
                      style={{ color: "#64748B" }}
                    >
                      {n.body}
                    </p>
                    <p className="text-[10px] mt-1" style={{ color: "#94A3B8" }}>
                      {timeAgo(n.createdAt)}
                    </p>
                  </div>
                  {!n.isRead && (
                    <button
                      type="button"
                      onClick={() => void markOne(n.id)}
                      className="mt-0.5 flex-shrink-0 rounded-lg p-1 transition-colors hover:bg-slate-100"
                      title="Okundu işaretle"
                    >
                      <Check className="h-3.5 w-3.5" style={{ color: "#F97316" }} />
                    </button>
                  )}
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div
              className="px-4 py-2.5"
              style={{ borderTop: "1px solid #F1F5F9" }}
            >
              <button
                type="button"
                onClick={async () => {
                  await fetch("/api/notifications", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({}) });
                  setUnreadCount(0);
                  setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
                }}
                className="flex items-center gap-1.5 text-[11px] font-bold transition-colors hover:opacity-80"
                style={{ color: "#F97316" }}
              >
                <CheckCheck className="h-3.5 w-3.5" />
                Tümünü okundu işaretle
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

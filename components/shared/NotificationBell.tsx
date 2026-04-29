"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Bell, X } from "lucide-react";

type AppNotification = {
  id: string;
  title: string;
  body: string;
  type: string;
  isRead: boolean;
  createdAt: string;
};

const TYPE_ICON: Record<string, string> = {
  NEW_ASSIGNMENT:         "📋",
  COACH_ACCEPTED:         "✅",
  COACH_REJECTED:         "❌",
  NEW_CONNECTION_REQUEST: "🤝",
  DIRECT_MESSAGE:         "💬",
  WORKOUT_COMPLETED:      "🏆",
  WORKOUT_COMMENT:        "💬",
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

function buildWsUrl(token: string): string {
  const explicitBase = process.env.NEXT_PUBLIC_WS_URL?.trim();
  if (explicitBase) {
    try {
      const normalized = explicitBase.startsWith("http://")
        ? explicitBase.replace("http://", "ws://")
        : explicitBase.startsWith("https://")
          ? explicitBase.replace("https://", "wss://")
          : explicitBase;
      const url = new URL(normalized);
      if (window.location.protocol === "https:" && url.protocol === "ws:") {
        url.protocol = "wss:";
      }
      const isLocal = url.hostname === "localhost" || url.hostname === "127.0.0.1";
      if (isLocal && window.location.hostname !== "localhost") {
        url.hostname = window.location.hostname;
        url.port = window.location.protocol === "https:" ? "" : window.location.port || "";
      }
      return `${url.toString()}?token=${encodeURIComponent(token)}`;
    } catch {
      return `${explicitBase}?token=${encodeURIComponent(token)}`;
    }
  }
  const proto = window.location.protocol === "https:" ? "wss" : "ws";
  return `${proto}://${window.location.host}/ws?token=${encodeURIComponent(token)}`;
}

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [wsConnected, setWsConnected] = useState(false);

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pingRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const connectWsRef = useRef<() => void>(() => undefined);
  const panelRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const mountedRef = useRef(true);

  const scheduleReconnect = useCallback(() => {
    if (reconnectRef.current) {
      clearTimeout(reconnectRef.current);
    }

    reconnectRef.current = setTimeout(() => {
      if (mountedRef.current) {
        connectWsRef.current();
      }
    }, 1200);
  }, []);

  // ── REST fetch ─────────────────────────────────────────────────
  const fetchNotifications = useCallback(async () => {
    try {
      const res = await fetch("/api/notifications", { cache: "no-store" });
      if (!res.ok || !mountedRef.current) return;
      const data = await res.json();
      setNotifications(data.notifications ?? []);
      setUnreadCount(data.unreadCount ?? 0);
    } catch { /* silent */ }
  }, []);

  // ── WebSocket ──────────────────────────────────────────────────
  const connectWs = useCallback(async () => {
    if (!mountedRef.current) return;
    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    try {
      const tokenRes = await fetch("/api/messages/ws-token", { cache: "no-store" });
      if (!tokenRes.ok || !mountedRef.current) {
        scheduleReconnect();
        return;
      }
      const { token } = await tokenRes.json();
      if (!token) {
        scheduleReconnect();
        return;
      }

      const ws = new WebSocket(buildWsUrl(token));
      wsRef.current = ws;

      ws.onopen = () => {
        if (!mountedRef.current) { ws.close(); return; }
        setWsConnected(true);
        void fetchNotifications();
        if (reconnectRef.current) {
          clearTimeout(reconnectRef.current);
          reconnectRef.current = null;
        }
        // Ping every 25 s to keep alive
        if (pingRef.current) clearInterval(pingRef.current);
        pingRef.current = setInterval(() => {
          if (ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify({ type: "ping" }));
        }, 25000);
      };

      ws.onmessage = (evt) => {
        if (!mountedRef.current) return;
        try {
          const msg = JSON.parse(evt.data);
          if (msg.type === "notification_created" && msg.notification) {
            const n: AppNotification = msg.notification;
            setNotifications((prev) => {
              if (prev.some((item) => item.id === n.id)) return prev;
              return [n, ...prev].slice(0, 10);
            });
            setUnreadCount((c) => c + (n.isRead ? 0 : 1));
          }
        } catch { /* bad json */ }
      };

      ws.onclose = () => {
        if (pingRef.current) clearInterval(pingRef.current);
        setWsConnected(false);
        if (!mountedRef.current) return;
        scheduleReconnect();
      };

      ws.onerror = () => ws.close();
    } catch {
      setWsConnected(false);
      scheduleReconnect();
    }
  }, [fetchNotifications, scheduleReconnect]);

  useEffect(() => {
    connectWsRef.current = () => {
      void connectWs();
    };
  }, [connectWs]);

  // ── Mount / unmount ────────────────────────────────────────────
  useEffect(() => {
    mountedRef.current = true;
    void fetchNotifications();
    void connectWs();

    // Fallback polling every 5 s if WS drops or server-side emit is missed.
    const pollId = setInterval(() => void fetchNotifications(), 5000);

    return () => {
      mountedRef.current = false;
      clearInterval(pollId);
      if (reconnectRef.current) clearTimeout(reconnectRef.current);
      if (pingRef.current) clearInterval(pingRef.current);
      wsRef.current?.close();
    };
  }, [fetchNotifications, connectWs]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open]);

  // ── Close dropdown on outside click ───────────────────────────
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (
        panelRef.current?.contains(e.target as Node) ||
        buttonRef.current?.contains(e.target as Node)
      ) return;
      setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  // ── Mark all as read when opening ─────────────────────────────
  const handleToggle = async () => {
    const next = !open;
    setOpen(next);
    if (next && unreadCount > 0) {
      try {
        await fetch("/api/notifications", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({}),
        });
        setUnreadCount(0);
        setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      } catch { /* silent */ }
    }
  };

  // ── Render ─────────────────────────────────────────────────────
  return (
    <div className="relative">
      {/* Bell button */}
      <button
        ref={buttonRef}
        type="button"
        onClick={() => void handleToggle()}
        className="relative flex h-9 w-9 items-center justify-center rounded-lg text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800/60"
        title="Bildirimler"
      >
        <Bell
          className="h-5 w-5"
          style={unreadCount > 0 ? { color: "#F97316" } : undefined}
        />
        {unreadCount > 0 && (
          <span
            className="absolute -top-0.5 -right-0.5 flex min-w-[16px] h-4 items-center justify-center rounded-full px-0.5 text-[10px] font-black text-white"
            style={{ background: "#F97316" }}
          >
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
        {/* WS connected dot */}
        {wsConnected && (
          <span
            className="absolute bottom-1 right-1 h-1.5 w-1.5 rounded-full"
            style={{ background: "#22C55E" }}
            title="Gerçek zamanlı bağlı"
          />
        )}
      </button>

      {/* Dropdown panel */}
      {open && (
        <>
          <button
            type="button"
            aria-label="Bildirim panelini kapat"
            onClick={() => setOpen(false)}
            className="fixed inset-0 z-[90] cursor-default bg-transparent"
          />
          <div
            ref={panelRef}
            className="absolute right-0 top-full z-[100] mt-2 w-80 overflow-hidden rounded-2xl"
            style={{
              background: "#fff",
              boxShadow: "0 8px 32px rgba(0,0,0,0.14), 0 2px 8px rgba(0,0,0,0.06)",
              border: "1px solid rgba(0,0,0,0.06)",
            }}
          >
          {/* Panel header */}
          <div
            className="flex items-center justify-between px-4 py-3"
            style={{ borderBottom: "1px solid #F1F5F9" }}
          >
            <div className="flex items-center gap-2">
              <Bell className="h-4 w-4" style={{ color: "#F97316" }} />
              <span
                className="text-[14px] font-black"
                style={{ color: "#1E293B" }}
              >
                Bildirimler
              </span>
              {unreadCount > 0 && (
                <span
                  className="rounded-full px-2 py-0.5 text-[10px] font-black text-white"
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

          {/* Notification list */}
          <div className="max-h-[360px] overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="flex flex-col items-center py-10 px-4">
                <Bell className="h-8 w-8 mb-2" style={{ color: "#CBD5E1" }} />
                <p
                  className="text-[13px] text-center"
                  style={{ color: "#94A3B8" }}
                >
                  Henüz bildirim yok
                </p>
              </div>
            ) : (
              notifications.slice(0, 10).map((n) => (
                <div
                  key={n.id}
                  className="flex items-start gap-3 px-4 py-3"
                  style={{
                    background: n.isRead ? "#fff" : "#FFF7ED",
                    borderBottom: "1px solid #F8FAFC",
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
                      className="text-[13px] font-bold leading-snug"
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
                    <p
                      className="text-[10px] mt-1"
                      style={{ color: "#94A3B8" }}
                    >
                      {timeAgo(n.createdAt)}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
          </div>
        </>
      )}
    </div>
  );
}

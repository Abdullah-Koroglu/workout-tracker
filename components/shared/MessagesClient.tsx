"use client";

import { FormEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, CheckCheck, MessageCircle, Plus, Send } from "lucide-react";

import { useNotificationContext } from "@/contexts/NotificationContext";
import { PushNotificationToggle } from "@/components/shared/PushNotificationToggle";

type Thread = {
  user: {
    id: string;
    name: string;
    email: string;
  };
  unreadCount: number;
  lastMessage: {
    id: string;
    content: string;
    createdAt: string;
    senderId: string;
  } | null;
};

type MessageItem = {
  id: string;
  senderId: string;
  receiverId: string;
  content: string;
  isRead: boolean;
  createdAt: string;
  optimistic?: boolean;
  sender?: { id: string; name: string };
};

type WsIncomingMessage =
  | {
      type: "welcome";
      userId: string;
      sessionId: string;
    }
  | {
      type: "message_sent";
      clientId: string;
      message: MessageItem;
    }
  | {
      type: "new_message";
      message: MessageItem;
    }
  | {
      type: "ws_error";
      code: string;
      message: string;
    }
  | {
      type: "pong";
    };

type WsOutgoingMessage =
  | {
      type: "send_message";
      receiverId: string;
      content: string;
      clientId: string;
    }
  | {
      type: "ping";
    };

const REQUEST_TIMEOUT_MS = 12000;

function mergeMessage(list: MessageItem[], message: MessageItem) {
  if (list.some((item) => item.id === message.id)) {
    return list;
  }

  const next = [...list, message];
  next.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  return next;
}

function buildWsUrl(token: string) {
  const explicitBaseUrl = process.env.NEXT_PUBLIC_WS_URL?.trim();

  if (explicitBaseUrl) {
    try {
      if (explicitBaseUrl.startsWith("/")) {
        const protocol = window.location.protocol === "https:" ? "wss" : "ws";
        const delimiter = explicitBaseUrl.includes("?") ? "&" : "?";
        return `${protocol}://${window.location.host}${explicitBaseUrl}${delimiter}token=${encodeURIComponent(token)}`;
      }

      const normalizedInput = explicitBaseUrl.startsWith("http://")
        ? explicitBaseUrl.replace("http://", "ws://")
        : explicitBaseUrl.startsWith("https://")
          ? explicitBaseUrl.replace("https://", "wss://")
          : explicitBaseUrl;

      const url = new URL(normalizedInput);
      const isLocalHost = url.hostname === "localhost" || url.hostname === "127.0.0.1";

      if (typeof window !== "undefined") {
        if (window.location.protocol === "https:" && url.protocol === "ws:") {
          url.protocol = "wss:";
        }

        if (isLocalHost && window.location.hostname !== "localhost" && window.location.hostname !== "127.0.0.1") {
          url.hostname = window.location.hostname;
          if (window.location.protocol === "https:") {
            url.port = "";
          } else if (window.location.port && !url.port) {
            url.port = window.location.port;
          }
        }
      }

      const delimiter = url.toString().includes("?") ? "&" : "?";
      return `${url.toString()}${delimiter}token=${encodeURIComponent(token)}`;
    } catch {
      const delimiter = explicitBaseUrl.includes("?") ? "&" : "?";
      return `${explicitBaseUrl}${delimiter}token=${encodeURIComponent(token)}`;
    }
  }

  const protocol = window.location.protocol === "https:" ? "wss" : "ws";
  return `${protocol}://${window.location.host}/ws?token=${encodeURIComponent(token)}`;
}

function updateThreadsWithLatestMessage(
  previous: Thread[],
  message: MessageItem,
  currentUserId: string,
  activePeerId: string
) {
  const peerId = message.senderId === currentUserId ? message.receiverId : message.senderId;

  return previous.map((thread) => {
    if (thread.user.id !== peerId) {
      return thread;
    }

    const incrementUnread = message.senderId === peerId && peerId !== activePeerId;

    return {
      ...thread,
      unreadCount: incrementUnread ? thread.unreadCount + 1 : 0,
      lastMessage: {
        id: message.id,
        content: message.content,
        createdAt: message.createdAt,
        senderId: message.senderId
      }
    };
  }).sort((a, b) => {
    const aTime = a.lastMessage ? new Date(a.lastMessage.createdAt).getTime() : 0;
    const bTime = b.lastMessage ? new Date(b.lastMessage.createdAt).getTime() : 0;
    return bTime - aTime;
  });
}

export function MessagesClient({
  currentUserId,
  currentUserRole
}: {
  currentUserId: string;
  currentUserRole: "COACH" | "CLIENT";
}) {
  const { error, success } = useNotificationContext();
  const [threads, setThreads] = useState<Thread[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string>("");
  const [messages, setMessages] = useState<MessageItem[]>([]);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const nextCursorRef = useRef<string | null>(null);
  const [wsConnected, setWsConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimerRef = useRef<number | null>(null);
  const manualCloseRef = useRef(false);
  const pingTimerRef = useRef<number | null>(null);
  const refreshTimerRef = useRef<number | null>(null);
  const activePeerRef = useRef<string>("");
  const preferredPeerRef = useRef<string>("");
  const [isThreadPanelOpen, setIsThreadPanelOpen] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const messagesContainerRef = useRef<HTMLDivElement | null>(null);
  // tracks whether the next messages state update should scroll to bottom
  const scrollToBottomRef = useRef(true);

  const selectedThread = useMemo(
    () => threads.find((thread) => thread.user.id === selectedUserId) || null,
    [selectedUserId, threads]
  );

  const wsStatusDotClass = wsConnected ? "bg-emerald-500" : "bg-amber-500";
  const wsStatusDotKineticClass = wsConnected ? "bg-primary" : "bg-secondary";

  const selectThread = useCallback((userId: string) => {
    activePeerRef.current = userId;
    setSelectedUserId(userId);
    setIsThreadPanelOpen(false);
  }, []);

  useEffect(() => {
    activePeerRef.current = selectedUserId;
    if (selectedUserId) {
      setIsThreadPanelOpen(false);
    }
  }, [selectedUserId]);

  const fetchMessages = useCallback(async (withUserId: string, options?: { silent?: boolean }) => {
    if (!withUserId) return;

    const silent = options?.silent ?? false;
    if (!silent) {
      setLoadingMessages(true);
    }

    try {
      const controller = new AbortController();
      const timeoutId = window.setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

      const response = await fetch(`/api/messages?withUserId=${withUserId}&limit=20`, {
        cache: "no-store",
        signal: controller.signal
      }).finally(() => {
        window.clearTimeout(timeoutId);
      });

      if (!response.ok) {
        return;
      }

      const data = await response.json();
      scrollToBottomRef.current = true;
      setMessages(data.messages || []);
      setHasMore(data.hasMore ?? false);
      nextCursorRef.current = data.nextCursor ?? null;
    } catch {
      return;
    } finally {
      if (!silent) {
        setLoadingMessages(false);
      }
    }
  }, []);

  const loadMoreMessages = useCallback(async () => {
    if (!selectedUserId || !nextCursorRef.current || loadingMore) return;

    setLoadingMore(true);
    try {
      const controller = new AbortController();
      const timeoutId = window.setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

      const url = `/api/messages?withUserId=${selectedUserId}&limit=20&cursor=${encodeURIComponent(nextCursorRef.current)}`;
      const response = await fetch(url, {
        cache: "no-store",
        signal: controller.signal
      }).finally(() => {
        window.clearTimeout(timeoutId);
      });

      if (!response.ok) return;

      const data = await response.json();
      const older: MessageItem[] = data.messages || [];

      // Preserve scroll position: measure height before prepending
      const container = messagesContainerRef.current;
      const prevScrollHeight = container?.scrollHeight ?? 0;

      scrollToBottomRef.current = false;
      setMessages((prev) => {
        const existingIds = new Set(prev.map((m) => m.id));
        const fresh = older.filter((m) => !existingIds.has(m.id));
        return [...fresh, ...prev];
      });
      setHasMore(data.hasMore ?? false);
      nextCursorRef.current = data.nextCursor ?? null;

      // Restore scroll so older messages appear above without jumping
      requestAnimationFrame(() => {
        if (container) {
          container.scrollTop = container.scrollHeight - prevScrollHeight;
        }
      });
    } catch {
      return;
    } finally {
      setLoadingMore(false);
    }
  }, [selectedUserId, loadingMore]);

  const fetchThreads = useCallback(async (options?: { syncSelectedMessages?: boolean; silent?: boolean }) => {
    const silent = options?.silent ?? false;
    if (!silent) {
      setRefreshing(true);
    }

    try {
      const controller = new AbortController();
      const timeoutId = window.setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

      const response = await fetch("/api/messages/threads", {
        cache: "no-store",
        signal: controller.signal
      }).finally(() => {
        window.clearTimeout(timeoutId);
      });

      if (!response.ok) {
        return;
      }

      const data = await response.json();
      setThreads(data.threads || []);

      let selectedAfterSync = selectedUserId;

      if (!selectedUserId && data.threads?.length) {
        const preferred = preferredPeerRef.current;
        const preferredExists = preferred && data.threads.some((thread: Thread) => thread.user.id === preferred);
        selectedAfterSync = preferredExists ? preferred : data.threads[0].user.id;
        activePeerRef.current = selectedAfterSync;
        setSelectedUserId(selectedAfterSync);
      }

      if (options?.syncSelectedMessages && selectedAfterSync) {
        await fetchMessages(selectedAfterSync, { silent: true });
      }
    } catch {
      return;
    } finally {
      if (!silent) {
        setRefreshing(false);
      }
    }
  }, [fetchMessages, selectedUserId]);

  const cleanupSocket = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }

    if (pingTimerRef.current) {
      window.clearInterval(pingTimerRef.current);
      pingTimerRef.current = null;
    }
  }, []);

  const scheduleReconnect = useCallback(() => {
    if (reconnectTimerRef.current) {
      window.clearTimeout(reconnectTimerRef.current);
    }

    reconnectTimerRef.current = window.setTimeout(() => {
      void connectSocket();
    }, 1800);
  }, []);

  const connectSocket = useCallback(async () => {
    try {
      const tokenResponse = await fetch("/api/messages/ws-token", { cache: "no-store" });
      if (!tokenResponse.ok) {
        setWsConnected(false);
        scheduleReconnect();
        return;
      }

      const tokenData = await tokenResponse.json();
      const token = tokenData.token;
      if (!token) {
        setWsConnected(false);
        scheduleReconnect();
        return;
      }

      cleanupSocket();
      const socket = new WebSocket(buildWsUrl(token));
      wsRef.current = socket;

      socket.onopen = () => {
        setWsConnected(true);

        pingTimerRef.current = window.setInterval(() => {
          if (socket.readyState === WebSocket.OPEN) {
            const payload: WsOutgoingMessage = { type: "ping" };
            socket.send(JSON.stringify(payload));
          }
        }, 25000);
      };

      socket.onmessage = (event) => {
        let payload: WsIncomingMessage;
        try {
          payload = JSON.parse(event.data) as WsIncomingMessage;
        } catch {
          return;
        }

        if (payload.type === "ws_error") {
          error(payload.message || "Mesajlasma baglantisinda hata olustu.");
          return;
        }

        if (payload.type === "message_sent") {
          scrollToBottomRef.current = true;
          setMessages((prev) => {
            const withoutTemp = prev.filter((item) => item.id !== payload.clientId);
            return mergeMessage(withoutTemp, payload.message);
          });
          setThreads((prev) => updateThreadsWithLatestMessage(prev, payload.message, currentUserId, activePeerRef.current));
          void fetchThreads({ syncSelectedMessages: false, silent: true });
          return;
        }

        if (payload.type === "new_message") {
          const incoming = payload.message;
          const peerId = incoming.senderId === currentUserId ? incoming.receiverId : incoming.senderId;

          setThreads((prev) => updateThreadsWithLatestMessage(prev, incoming, currentUserId, activePeerRef.current));

          if (peerId === activePeerRef.current) {
            scrollToBottomRef.current = true;
            setMessages((prev) => mergeMessage(prev, incoming));
          }

          void fetchThreads({ syncSelectedMessages: false, silent: true });
        }
      };

      socket.onclose = () => {
        setWsConnected(false);

        if (pingTimerRef.current) {
          window.clearInterval(pingTimerRef.current);
          pingTimerRef.current = null;
        }

        if (!manualCloseRef.current) {
          scheduleReconnect();
        }
      };

      socket.onerror = () => {
        setWsConnected(false);
        socket.close();
      };
    } catch {
      setWsConnected(false);
      scheduleReconnect();
    }
  }, [cleanupSocket, currentUserId, error, fetchMessages, scheduleReconnect]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const params = new URLSearchParams(window.location.search);
    preferredPeerRef.current = params.get("withUserId") || "";
  }, []);

  useEffect(() => {
    void fetchThreads({ syncSelectedMessages: true });
  }, [fetchThreads]);

  useEffect(() => {
    if (!selectedUserId) return;
    void fetchMessages(selectedUserId);
  }, [fetchMessages, selectedUserId]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const syncFromApi = () => {
      void fetchThreads({ syncSelectedMessages: true, silent: true });
    };

    const onVisibility = () => {
      if (document.visibilityState === "visible") {
        syncFromApi();
      }
    };

    window.addEventListener("focus", syncFromApi);
    document.addEventListener("visibilitychange", onVisibility);
    refreshTimerRef.current = window.setInterval(syncFromApi, 12000);

    return () => {
      window.removeEventListener("focus", syncFromApi);
      document.removeEventListener("visibilitychange", onVisibility);
      if (refreshTimerRef.current) {
        window.clearInterval(refreshTimerRef.current);
      }
    };
  }, [fetchThreads]);

  useEffect(() => {
    if (!scrollToBottomRef.current) return;
    const container = messagesContainerRef.current;
    if (!container) return;
    container.scrollTop = container.scrollHeight;
  }, [messages, selectedUserId]);

  useEffect(() => {
    manualCloseRef.current = false;
    void connectSocket();

    return () => {
      manualCloseRef.current = true;
      cleanupSocket();
      if (reconnectTimerRef.current) {
        window.clearTimeout(reconnectTimerRef.current);
      }
    };
  }, [cleanupSocket, connectSocket]);

  const onSend = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedUserId || !draft.trim() || sending) {
      return;
    }

    const tempId = `temp-${Date.now()}`;
    const optimistic: MessageItem = {
      id: tempId,
      senderId: currentUserId,
      receiverId: selectedUserId,
      content: draft.trim(),
      isRead: false,
      createdAt: new Date().toISOString(),
      optimistic: true
    };

    setMessages((prev) => mergeMessage(prev, optimistic));
    const content = draft.trim();
    setDraft("");
    setSending(true);

    const socket = wsRef.current;
    if (socket && socket.readyState === WebSocket.OPEN) {
      const payload: WsOutgoingMessage = {
        type: "send_message",
        receiverId: selectedUserId,
        content,
        clientId: tempId
      };

      socket.send(JSON.stringify(payload));
      setSending(false);
      return;
    }

    const response = await fetch("/api/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ receiverId: selectedUserId, content })
    });

    const data = await response.json().catch(() => ({}));
    setSending(false);

    if (!response.ok) {
      error(data.error || "Mesaj gonderilemedi.");
      setDraft(content);
      setMessages((prev) => prev.filter((item) => item.id !== tempId));
      return;
    }

    success("Mesaj gonderildi.");
    setMessages((prev) => {
      const withoutTemp = prev.filter((item) => item.id !== tempId);
      return mergeMessage(withoutTemp, data.message);
    });
    setThreads((prev) => updateThreadsWithLatestMessage(prev, data.message, currentUserId, selectedUserId));
    void fetchThreads({ syncSelectedMessages: true, silent: true });
  };

  const handleRefresh = () => {
    void fetchThreads({ syncSelectedMessages: true });
  };

  // ─── helpers ────────────────────────────────────────────────────────────────

  function getInitials(name: string) {
    return name
      .split(" ")
      .map((w) => w[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();
  }

  function formatTime(iso: string) {
    const d = new Date(iso);
    const now = new Date();
    const isToday =
      d.getDate() === now.getDate() &&
      d.getMonth() === now.getMonth() &&
      d.getFullYear() === now.getFullYear();
    if (isToday) {
      return d.toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" });
    }
    return d.toLocaleDateString("tr-TR", { day: "2-digit", month: "2-digit" });
  }

  function groupMessagesByDate(msgs: MessageItem[]) {
    const groups: { label: string; messages: MessageItem[] }[] = [];
    let currentLabel = "";
    for (const msg of msgs) {
      const d = new Date(msg.createdAt);
      const label = d.toLocaleDateString("tr-TR", { weekday: "short", day: "numeric", month: "short" });
      if (label !== currentLabel) {
        currentLabel = label;
        groups.push({ label, messages: [] });
      }
      groups[groups.length - 1].messages.push(msg);
    }
    return groups;
  }

  // ─── render ─────────────────────────────────────────────────────────────────

  // Thread list view
  if (isThreadPanelOpen || !selectedThread) {
    return (
      <div className="flex h-[calc(100dvh-4rem)] flex-col bg-background">
        {/* Header */}
        <header className="sticky top-0 z-10 flex items-center justify-between border-b border-black/10 bg-background/95 px-4 py-3 backdrop-blur">
          <span className="w-8" />
          <h1 className="text-base font-black tracking-tight text-foreground">Messages</h1>
          <div className="flex items-center gap-1">
            <span className={`h-2 w-2 rounded-full ${wsStatusDotKineticClass}`} />
            <PushNotificationToggle />
          </div>
        </header>

        {/* Thread list */}
        <div className="flex-1 overflow-y-auto divide-y divide-border">
          {threads.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center gap-3 p-8 text-center text-muted-foreground">
              <MessageCircle className="h-12 w-12 text-muted-foreground/40" />
              <p className="text-sm">Henüz mesajlaşabileceğin bağlantı yok.</p>
              <button
                type="button"
                onClick={handleRefresh}
                disabled={refreshing}
                className="rounded-full bg-gradient-to-br from-primary to-[hsl(24_95%_60%)] px-5 py-2 text-sm font-semibold text-white disabled:opacity-50"
              >
                Yenile
              </button>
            </div>
          ) : (
            threads.map((thread) => {
              const isActive = thread.user.id === selectedUserId;
              return (
                <button
                  key={thread.user.id}
                  type="button"
                  onClick={() => selectThread(thread.user.id)}
                  className={`flex w-full items-center gap-3 px-4 py-3 text-left transition-colors ${
                    isActive ? "bg-primary/15" : "hover:bg-muted/40"
                  }`}
                >
                  {/* Avatar */}
                  <div className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-secondary/20 text-sm font-bold text-secondary">
                    {getInitials(thread.user.name)}
                  </div>

                  {/* Content */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline justify-between gap-2">
                      <span className="truncate text-sm font-semibold text-foreground">
                        {thread.user.name}
                      </span>
                      {thread.lastMessage && (
                        <span className="shrink-0 text-[11px] text-muted-foreground">
                          {formatTime(thread.lastMessage.createdAt)}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <p className="truncate text-xs text-muted-foreground">
                        {thread.lastMessage?.content || "Henüz mesaj yok"}
                      </p>
                      {thread.unreadCount > 0 && (
                        <span className="shrink-0 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-primary px-1.5 text-[10px] font-bold text-white">
                          {thread.unreadCount > 99 ? "99+" : thread.unreadCount}
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              );
            })
          )}
        </div>

        {/* New message FAB */}
        <button
          type="button"
          onClick={handleRefresh}
          disabled={refreshing}
          className="absolute bottom-6 right-4 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-primary to-[hsl(24_95%_60%)] text-white shadow-lg transition hover:brightness-105 disabled:opacity-60"
          aria-label="Yenile"
        >
          <Plus className="h-6 w-6" />
        </button>
      </div>
    );
  }

  // Active chat thread view
  const messageGroups = groupMessagesByDate(messages);

  return (
    <div className="flex h-[calc(100dvh-4rem)] flex-col bg-background">
      {/* Chat header */}
      <header className="sticky top-0 z-10 flex items-center gap-3 border-b border-black/10 bg-background/95 px-3 py-2.5 backdrop-blur">
        <button
          type="button"
          onClick={() => setIsThreadPanelOpen(true)}
          className="flex h-9 w-9 items-center justify-center rounded-full hover:bg-muted"
          aria-label="Geri"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>

        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-secondary/20 text-xs font-bold text-secondary">
          {getInitials(selectedThread.user.name)}
        </div>

        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-foreground leading-tight">
            {selectedThread.user.name}
          </p>
          <p className="flex items-center gap-1 text-[11px] text-muted-foreground">
            <span className={`h-1.5 w-1.5 rounded-full ${wsStatusDotKineticClass}`} />
            {wsConnected ? "Çevrimiçi" : "Bağlanıyor..."}
          </p>
        </div>

        <PushNotificationToggle />
      </header>

      {/* Messages area */}
      <div
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto px-3 py-4 space-y-1"
      >
        {loadingMessages ? (
          <div className="flex h-full items-center justify-center">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center gap-2 text-center text-muted-foreground">
            <MessageCircle className="h-10 w-10 text-muted-foreground/30" />
            <p className="text-sm">İlk mesajı göndererek konuşmayı başlat.</p>
          </div>
        ) : (
          <>
            {/* Load more button at the top */}
            {hasMore && (
              <div className="flex justify-center pb-2">
                <button
                  type="button"
                  onClick={() => void loadMoreMessages()}
                  disabled={loadingMore}
                  className="rounded-full bg-muted px-4 py-1.5 text-xs font-medium text-muted-foreground transition hover:bg-muted/80 disabled:opacity-50"
                >
                  {loadingMore ? "Yükleniyor..." : "Önceki mesajları yükle"}
                </button>
              </div>
            )}

            {messageGroups.map((group) => (
            <div key={group.label}>
              {/* Date separator */}
              <div className="my-4 flex items-center justify-center">
                <span className="rounded-full bg-muted px-3 py-0.5 text-[11px] text-muted-foreground">
                  {group.label}
                </span>
              </div>

              {group.messages.map((message) => {
                const mine = message.senderId === currentUserId;
                return (
                  <div
                    key={message.id}
                    className={`mb-1.5 flex items-end gap-2 ${mine ? "justify-end" : "justify-start"}`}
                  >
                    {/* Incoming avatar */}
                    {!mine && (
                      <div className="mb-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-secondary/20 text-[10px] font-bold text-secondary">
                        {getInitials(selectedThread.user.name)}
                      </div>
                    )}

                    <div className={`max-w-[75%] ${mine ? "items-end" : "items-start"} flex flex-col`}>
                      <div
                        className={`rounded-2xl px-3.5 py-2 text-sm leading-relaxed ${
                          mine
                            ? "rounded-br-sm bg-secondary text-white"
                            : "rounded-bl-sm bg-muted text-foreground"
                        } ${message.optimistic ? "opacity-70" : ""}`}
                      >
                        {message.content}
                      </div>

                      {/* Meta: time + read tick for outgoing */}
                      <div className={`mt-0.5 flex items-center gap-1 ${mine ? "justify-end" : "justify-start"}`}>
                        <span className="text-[10px] text-muted-foreground">
                          {new Date(message.createdAt).toLocaleTimeString("tr-TR", {
                            hour: "2-digit",
                            minute: "2-digit"
                          })}
                          {message.optimistic ? "  ·" : ""}
                        </span>
                        {mine && !message.optimistic && (
                          <CheckCheck className="h-3 w-3 text-primary" />
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
          </>
        )}
      </div>

      {/* Input footer */}
      <form
        onSubmit={onSend}
        className="sticky bottom-0 flex items-center gap-2 border-t bg-background px-3 py-2.5"
      >
        <button
          type="button"
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground hover:bg-muted/80"
          aria-label="Medya ekle"
        >
          <Plus className="h-5 w-5" />
        </button>

        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Mesaj yaz..."
          className="h-10 flex-1 rounded-full border-0 bg-muted px-4 text-sm outline-none focus:ring-2 focus:ring-primary"
        />

        <button
          type="submit"
          disabled={sending || !draft.trim()}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary to-[hsl(24_95%_60%)] text-white transition hover:brightness-105 disabled:opacity-50"
          aria-label="Gönder"
        >
          <Send className="h-4 w-4" />
        </button>
      </form>
    </div>
  );
}

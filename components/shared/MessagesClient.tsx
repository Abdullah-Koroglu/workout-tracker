"use client";

import { FormEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, MessageCircle, PanelLeft, RefreshCcw, Send } from "lucide-react";

import { Button } from "@/components/ui/button";
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
    const normalizedBaseUrl = explicitBaseUrl.startsWith("http://")
      ? explicitBaseUrl.replace("http://", "ws://")
      : explicitBaseUrl.startsWith("https://")
        ? explicitBaseUrl.replace("https://", "wss://")
        : explicitBaseUrl;

    const delimiter = normalizedBaseUrl.includes("?") ? "&" : "?";
    return `${normalizedBaseUrl}${delimiter}token=${encodeURIComponent(token)}`;
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

  const selectedThread = useMemo(
    () => threads.find((thread) => thread.user.id === selectedUserId) || null,
    [selectedUserId, threads]
  );

  useEffect(() => {
    activePeerRef.current = selectedUserId;
  }, [selectedUserId]);

  const fetchMessages = useCallback(async (withUserId: string, options?: { silent?: boolean }) => {
    if (!withUserId) return;

    const silent = options?.silent ?? false;
    if (!silent) {
      setLoadingMessages(true);
    }

    const response = await fetch(`/api/messages?withUserId=${withUserId}`, {
      cache: "no-store"
    });

    if (!response.ok) {
      if (!silent) {
        setLoadingMessages(false);
      }
      return;
    }

    const data = await response.json();
    setMessages(data.messages || []);
    if (!silent) {
      setLoadingMessages(false);
    }
  }, []);

  const fetchThreads = useCallback(async (options?: { syncSelectedMessages?: boolean; silent?: boolean }) => {
    const silent = options?.silent ?? false;
    if (!silent) {
      setRefreshing(true);
    }

    const response = await fetch("/api/messages/threads", { cache: "no-store" });
    if (!response.ok) {
      if (!silent) {
        setRefreshing(false);
      }
      return;
    }

    const data = await response.json();
    setThreads(data.threads || []);

    let selectedAfterSync = selectedUserId;

    if (!selectedUserId && data.threads?.length) {
      const preferred = preferredPeerRef.current;
      const preferredExists = preferred && data.threads.some((thread: Thread) => thread.user.id === preferred);
      selectedAfterSync = preferredExists ? preferred : data.threads[0].user.id;
      setSelectedUserId(selectedAfterSync);
    }

    if (options?.syncSelectedMessages && selectedAfterSync) {
      await fetchMessages(selectedAfterSync, { silent: true });
    }

    if (!silent) {
      setRefreshing(false);
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

  const connectSocket = useCallback(async () => {
    try {
      const tokenResponse = await fetch("/api/messages/ws-token", { cache: "no-store" });
      if (!tokenResponse.ok) {
        setWsConnected(false);
        return;
      }

      const tokenData = await tokenResponse.json();
      const token = tokenData.token;
      if (!token) {
        setWsConnected(false);
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
          setMessages((prev) => {
            const withoutTemp = prev.filter((item) => item.id !== payload.clientId);
            return mergeMessage(withoutTemp, payload.message);
          });
          setThreads((prev) => updateThreadsWithLatestMessage(prev, payload.message, currentUserId, activePeerRef.current));
          void fetchThreads({ syncSelectedMessages: true, silent: true });
          return;
        }

        if (payload.type === "new_message") {
          const incoming = payload.message;
          const peerId = incoming.senderId === currentUserId ? incoming.receiverId : incoming.senderId;

          setThreads((prev) => updateThreadsWithLatestMessage(prev, incoming, currentUserId, activePeerRef.current));

          if (peerId === activePeerRef.current) {
            setMessages((prev) => mergeMessage(prev, incoming));

            if (incoming.senderId === activePeerRef.current && activePeerRef.current) {
              void fetchMessages(activePeerRef.current, { silent: true });
            }
          }

          void fetchThreads({ syncSelectedMessages: true, silent: true });
        }
      };

      socket.onclose = () => {
        setWsConnected(false);

        if (pingTimerRef.current) {
          window.clearInterval(pingTimerRef.current);
          pingTimerRef.current = null;
        }

        if (!manualCloseRef.current) {
          reconnectTimerRef.current = window.setTimeout(() => {
            void connectSocket();
          }, 1800);
        }
      };

      socket.onerror = () => {
        setWsConnected(false);
      };
    } catch {
      setWsConnected(false);
      reconnectTimerRef.current = window.setTimeout(() => {
        void connectSocket();
      }, 1800);
    }
  }, [cleanupSocket, currentUserId, error, fetchMessages]);

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
    const container = messagesContainerRef.current;
    if (!container) {
      return;
    }

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

  return (
    <div className="space-y-3 md:space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border bg-card p-4 shadow-sm">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">In-App Mesajlar</p>
          <h1 className="mt-1 text-2xl font-black text-foreground">Mesajlasma Merkezi</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {currentUserRole === "COACH"
              ? "Clientlarinla birebir mesajlasabilirsin."
              : "Coachlarinla antrenman hakkinda anlik mesajlasabilirsin."}
          </p>
          <p className="mt-2 text-xs font-semibold text-muted-foreground">
            Durum: {wsConnected ? "Canli bagli" : "Baglanti yeniden kuruluyor"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button type="button" variant="outline" className="h-10 gap-2" onClick={handleRefresh} disabled={refreshing}>
            <RefreshCcw className="h-4 w-4" />
            Yenile
          </Button>
          <PushNotificationToggle />
        </div>
      </div>

      <div className="grid gap-3 md:gap-4 lg:grid-cols-[340px_minmax(0,1fr)]">
        <aside
          className={`rounded-2xl border bg-card p-3 shadow-sm ${
            !isThreadPanelOpen && selectedThread ? "hidden lg:block" : "block"
          }`}
        >
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">Konusmalar</p>
          <div className="space-y-2 max-h-[68vh] overflow-y-auto pr-1 lg:max-h-[72vh]">
            {threads.length === 0 ? (
              <p className="rounded-xl border border-dashed p-3 text-sm text-muted-foreground">
                Henuz mesajlasabilecegin baglanti bulunmuyor.
              </p>
            ) : (
              threads.map((thread) => {
                const isActive = thread.user.id === selectedUserId;
                return (
                  <button
                    key={thread.user.id}
                    type="button"
                    onClick={() => {
                      setSelectedUserId(thread.user.id);
                      setIsThreadPanelOpen(false);
                    }}
                    className={`w-full rounded-2xl border p-3 text-left transition ${
                      isActive
                        ? "border-emerald-400 bg-emerald-50 shadow-sm"
                        : "border-border bg-background hover:bg-muted/40"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <p className="truncate text-sm font-semibold text-foreground">{thread.user.name}</p>
                      {thread.unreadCount > 0 ? (
                        <span className="rounded-full bg-emerald-600 px-2 py-0.5 text-[10px] font-bold text-white">
                          {thread.unreadCount}
                        </span>
                      ) : null}
                    </div>
                    <p className="mt-1 truncate text-xs text-muted-foreground">
                      {thread.lastMessage?.content || "Henuz mesaj yok"}
                    </p>
                    <p className="mt-1 text-[11px] text-muted-foreground">
                      {thread.lastMessage
                        ? new Date(thread.lastMessage.createdAt).toLocaleTimeString("tr-TR", {
                            hour: "2-digit",
                            minute: "2-digit"
                          })
                        : ""}
                    </p>
                  </button>
                );
              })
            )}
          </div>
        </aside>

        <section
          className={`min-h-[72vh] rounded-2xl border bg-card shadow-sm ${
            isThreadPanelOpen && !selectedThread ? "flex" : isThreadPanelOpen ? "hidden lg:flex" : "flex"
          } flex-col`}
        >
          {selectedThread ? (
            <>
              <div className="border-b px-3 py-3 sm:px-4">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex min-w-0 items-center gap-2">
                    <Button
                      type="button"
                      variant="ghost"
                      className="h-8 w-8 lg:hidden"
                      onClick={() => setIsThreadPanelOpen(true)}
                    >
                      <ArrowLeft className="h-4 w-4" />
                    </Button>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-foreground">{selectedThread.user.name}</p>
                      <p className="truncate text-xs text-muted-foreground">{selectedThread.user.email}</p>
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    className="h-8 gap-1 px-2 lg:hidden"
                    onClick={() => setIsThreadPanelOpen(true)}
                  >
                    <PanelLeft className="h-3.5 w-3.5" />
                    Liste
                  </Button>
                </div>
              </div>

              <div
                ref={messagesContainerRef}
                className="flex-1 space-y-3 overflow-y-auto bg-gradient-to-b from-background via-background to-emerald-50/30 p-3 sm:p-4"
              >
                {loadingMessages ? (
                  <p className="text-sm text-muted-foreground">Mesajlar yukleniyor...</p>
                ) : messages.length === 0 ? (
                  <div className="rounded-xl border border-dashed p-4 text-sm text-muted-foreground">
                    Ilk mesaji gondererek konusmayi baslat.
                  </div>
                ) : (
                  messages.map((message) => {
                    const mine = message.senderId === currentUserId;
                    return (
                      <div key={message.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                        <div
                          className={`max-w-[88%] rounded-3xl px-3 py-2.5 text-sm shadow-sm sm:max-w-[82%] ${
                            mine ? "bg-emerald-600 text-white" : "border bg-background text-foreground"
                          }`}
                        >
                          <p>{message.content}</p>
                          <p className={`mt-1 text-[10px] ${mine ? "text-emerald-100" : "text-muted-foreground"}`}>
                            {new Date(message.createdAt).toLocaleString("tr-TR")}
                            {message.optimistic ? " (gonderiliyor)" : ""}
                          </p>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              <form onSubmit={onSend} className="border-t bg-card p-2.5 sm:p-3">
                <div className="flex gap-2">
                  <input
                    value={draft}
                    onChange={(event) => setDraft(event.target.value)}
                    placeholder="Mesajini yaz..."
                    className="h-11 flex-1 rounded-2xl border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                  <Button type="submit" disabled={sending || !draft.trim()} className="h-11 gap-2 px-4">
                    <Send className="h-4 w-4" />
                    Gonder
                  </Button>
                </div>
              </form>
            </>
          ) : (
            <div className="flex h-full flex-1 items-center justify-center p-6 text-center text-muted-foreground">
              <div>
                <MessageCircle className="mx-auto h-10 w-10 text-emerald-600" />
                <p className="mt-3 text-sm">Mesajlasmaya baslamak icin bir konusma sec.</p>
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

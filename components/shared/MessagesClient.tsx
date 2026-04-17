"use client";

import { FormEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { MessageCircle, Send } from "lucide-react";

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
  const activePeerRef = useRef<string>("");
  const preferredPeerRef = useRef<string>("");

  const selectedThread = useMemo(
    () => threads.find((thread) => thread.user.id === selectedUserId) || null,
    [selectedUserId, threads]
  );

  useEffect(() => {
    activePeerRef.current = selectedUserId;
  }, [selectedUserId]);

  const fetchThreads = useCallback(async () => {
    const response = await fetch("/api/messages/threads", { cache: "no-store" });
    if (!response.ok) {
      return;
    }

    const data = await response.json();
    setThreads(data.threads || []);

    if (!selectedUserId && data.threads?.length) {
      const preferred = preferredPeerRef.current;
      const preferredExists = preferred && data.threads.some((thread: Thread) => thread.user.id === preferred);
      setSelectedUserId(preferredExists ? preferred : data.threads[0].user.id);
    }
  }, [selectedUserId]);

  const fetchMessages = useCallback(async (withUserId: string) => {
    if (!withUserId) return;

    setLoadingMessages(true);
    const response = await fetch(`/api/messages?withUserId=${withUserId}`, {
      cache: "no-store"
    });

    if (!response.ok) {
      setLoadingMessages(false);
      return;
    }

    const data = await response.json();
    setMessages(data.messages || []);
    setLoadingMessages(false);
  }, []);

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

      const protocol = window.location.protocol === "https:" ? "wss" : "ws";
      const socket = new WebSocket(`${protocol}://${window.location.host}/ws?token=${encodeURIComponent(token)}`);
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
          return;
        }

        if (payload.type === "new_message") {
          const incoming = payload.message;
          const peerId = incoming.senderId === currentUserId ? incoming.receiverId : incoming.senderId;

          setThreads((prev) => updateThreadsWithLatestMessage(prev, incoming, currentUserId, activePeerRef.current));

          if (peerId === activePeerRef.current) {
            setMessages((prev) => mergeMessage(prev, incoming));

            if (incoming.senderId === activePeerRef.current && activePeerRef.current) {
              void fetchMessages(activePeerRef.current);
            }
          }
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
    void fetchThreads();
  }, [fetchThreads]);

  useEffect(() => {
    if (!selectedUserId) return;
    void fetchMessages(selectedUserId);
  }, [fetchMessages, selectedUserId]);

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
  };

  return (
    <div className="space-y-4">
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
        <PushNotificationToggle />
      </div>

      <div className="grid gap-4 lg:grid-cols-[300px_minmax(0,1fr)]">
        <aside className="rounded-2xl border bg-card p-3 shadow-sm">
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">Konusmalar</p>
          <div className="space-y-2">
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
                    onClick={() => setSelectedUserId(thread.user.id)}
                    className={`w-full rounded-xl border p-3 text-left transition ${
                      isActive ? "border-emerald-400 bg-emerald-50" : "border-border hover:bg-muted/40"
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
                  </button>
                );
              })
            )}
          </div>
        </aside>

        <section className="flex min-h-[520px] flex-col rounded-2xl border bg-card shadow-sm">
          {selectedThread ? (
            <>
              <div className="border-b px-4 py-3">
                <p className="text-sm font-semibold text-foreground">{selectedThread.user.name}</p>
                <p className="text-xs text-muted-foreground">{selectedThread.user.email}</p>
              </div>

              <div className="flex-1 space-y-3 overflow-y-auto p-4">
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
                          className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm shadow-sm ${
                            mine ? "bg-emerald-600 text-white" : "bg-muted text-foreground"
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

              <form onSubmit={onSend} className="border-t p-3">
                <div className="flex gap-2">
                  <input
                    value={draft}
                    onChange={(event) => setDraft(event.target.value)}
                    placeholder="Mesajini yaz..."
                    className="h-11 flex-1 rounded-xl border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-emerald-500"
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
                <p className="mt-3 text-sm">Mesajlasmaya baslamak icin soldan bir kisi sec.</p>
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

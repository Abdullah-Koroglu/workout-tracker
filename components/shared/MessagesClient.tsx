"use client";

import { FormEvent, useEffect, useMemo, useOptimistic, useState } from "react";
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

  const [optimisticMessages, addOptimisticMessage] = useOptimistic(
    messages,
    (state: MessageItem[], optimisticValue: MessageItem) => [...state, optimisticValue]
  );

  const selectedThread = useMemo(
    () => threads.find((thread) => thread.user.id === selectedUserId) || null,
    [selectedUserId, threads]
  );

  const fetchThreads = async () => {
    const response = await fetch("/api/messages/threads", { cache: "no-store" });
    if (!response.ok) {
      return;
    }

    const data = await response.json();
    setThreads(data.threads || []);

    if (!selectedUserId && data.threads?.length) {
      setSelectedUserId(data.threads[0].user.id);
    }
  };

  const fetchMessages = async (withUserId: string) => {
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
  };

  useEffect(() => {
    void fetchThreads();
  }, []);

  useEffect(() => {
    if (!selectedUserId) return;
    void fetchMessages(selectedUserId);
  }, [selectedUserId]);

  useEffect(() => {
    const interval = setInterval(() => {
      void fetchThreads();
      if (selectedUserId) {
        void fetchMessages(selectedUserId);
      }
    }, 4000);

    return () => clearInterval(interval);
  }, [selectedUserId]);

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

    addOptimisticMessage(optimistic);
    const content = draft;
    setDraft("");
    setSending(true);

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
      void fetchMessages(selectedUserId);
      return;
    }

    success("Mesaj gonderildi.");
    setMessages((prev) => {
      const withoutTemp = prev.filter((item) => item.id !== tempId);
      return [...withoutTemp, data.message];
    });
    void fetchThreads();
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
                ) : optimisticMessages.length === 0 ? (
                  <div className="rounded-xl border border-dashed p-4 text-sm text-muted-foreground">
                    Ilk mesaji gondererek konusmayi baslat.
                  </div>
                ) : (
                  optimisticMessages.map((message) => {
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

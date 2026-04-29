/**
 * Emits a real-time notification_created event to a connected user via the WS server.
 * Falls back silently if the WS server is unavailable.
 */
export async function emitNotificationViaWs(
  userId: string,
  notification: {
    id: string;
    title: string;
    body: string;
    type: string;
    isRead: boolean;
    createdAt: string;
  }
): Promise<void> {
  const wsPort = process.env.WS_PORT || "3001";
  try {
    await fetch(`http://127.0.0.1:${wsPort}/internal/notify`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, notification }),
    });
  } catch {
    /* WS server unavailable — notification saved to DB, polling will catch it */
  }
}

/** Convenience: create a DB notification and emit it via WS. */
export function notifPayload(n: {
  id: string;
  title: string;
  body: string;
  type: string;
  isRead: boolean;
  createdAt: Date;
}) {
  return {
    id: n.id,
    title: n.title,
    body: n.body,
    type: n.type,
    isRead: n.isRead,
    createdAt: n.createdAt.toISOString(),
  };
}

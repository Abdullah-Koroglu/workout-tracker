const http = require("http");
const crypto = require("crypto");
const webpush = require("web-push");
const { WebSocketServer } = require("ws");
const { Prisma, PrismaClient } = require("@prisma/client");

const hostname = "0.0.0.0";
const port = Number(process.env.WS_PORT || 3001);
const prisma = new PrismaClient();

const socketsByUserId = new Map();
let pushConfigured = false;

function base64UrlEncode(input) {
  return Buffer.from(input)
    .toString("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
}

function base64UrlDecode(input) {
  const padded = input.replace(/-/g, "+").replace(/_/g, "/") + "=".repeat((4 - (input.length % 4)) % 4);
  return Buffer.from(padded, "base64").toString("utf8");
}

function getWsSecret() {
  return process.env.WS_AUTH_SECRET || process.env.NEXTAUTH_SECRET || process.env.AUTH_SECRET || "";
}

function verifyWsToken(token) {
  const secret = getWsSecret();
  if (!secret || !token || typeof token !== "string") {
    return null;
  }

  const [payloadPart, signaturePart] = token.split(".");
  if (!payloadPart || !signaturePart) {
    return null;
  }

  const expectedSig = crypto
    .createHmac("sha256", secret)
    .update(payloadPart)
    .digest("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");

  const expectedBuffer = Buffer.from(expectedSig);
  const actualBuffer = Buffer.from(signaturePart);

  if (expectedBuffer.length !== actualBuffer.length || !crypto.timingSafeEqual(expectedBuffer, actualBuffer)) {
    return null;
  }

  try {
    const payloadRaw = base64UrlDecode(payloadPart);
    const payload = JSON.parse(payloadRaw);
    if (!payload.uid || typeof payload.uid !== "string") {
      return null;
    }

    if (!payload.exp || typeof payload.exp !== "number" || payload.exp < Date.now()) {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}

function configureWebPush() {
  if (pushConfigured) {
    return;
  }

  const publicKey = process.env.VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  const subject = process.env.VAPID_SUBJECT || "mailto:support@example.com";

  if (!publicKey || !privateKey) {
    return;
  }

  webpush.setVapidDetails(subject, publicKey, privateKey);
  pushConfigured = true;
}

function isValidSubscription(input) {
  if (!input || typeof input !== "object") {
    return false;
  }

  return Boolean(
    input.endpoint &&
      input.keys &&
      typeof input.keys.auth === "string" &&
      typeof input.keys.p256dh === "string"
  );
}

async function sendPushToUser(userId, payload) {
  configureWebPush();
  if (!pushConfigured) {
    return;
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { pushSubscription: true }
  });

  if (!isValidSubscription(user?.pushSubscription)) {
    return;
  }

  try {
    await webpush.sendNotification(user.pushSubscription, JSON.stringify(payload));
  } catch (error) {
    const statusCode = error?.statusCode;
    if (statusCode === 404 || statusCode === 410) {
      await prisma.user.update({
        where: { id: userId },
        data: { pushSubscription: Prisma.DbNull }
      });
    }
  }
}

function addSocket(userId, ws) {
  const set = socketsByUserId.get(userId) || new Set();
  set.add(ws);
  socketsByUserId.set(userId, set);
}

function removeSocket(userId, ws) {
  const set = socketsByUserId.get(userId);
  if (!set) {
    return;
  }

  set.delete(ws);
  if (set.size === 0) {
    socketsByUserId.delete(userId);
  }
}

function isUserOnline(userId) {
  const set = socketsByUserId.get(userId);
  if (!set) {
    return false;
  }

  for (const socket of set) {
    if (socket.readyState === 1) {
      return true;
    }
  }

  return false;
}

function safeSend(ws, payload) {
  if (ws.readyState !== 1) {
    return;
  }

  ws.send(JSON.stringify(payload));
}

function sendToUser(userId, payload, excludeSocket) {
  const set = socketsByUserId.get(userId);
  if (!set) {
    return;
  }

  for (const socket of set) {
    if (excludeSocket && socket === excludeSocket) {
      continue;
    }

    safeSend(socket, payload);
  }
}

async function handleSendMessage(senderId, ws, data) {
  const receiverId = typeof data.receiverId === "string" ? data.receiverId : "";
  const contentRaw = typeof data.content === "string" ? data.content : "";
  const clientId = typeof data.clientId === "string" ? data.clientId : "";
  const content = contentRaw.trim();

  if (!receiverId || !content || content.length > 2000) {
    safeSend(ws, {
      type: "ws_error",
      code: "VALIDATION_ERROR",
      message: "Mesaj gecersiz."
    });
    return;
  }

  if (receiverId === senderId) {
    safeSend(ws, {
      type: "ws_error",
      code: "VALIDATION_ERROR",
      message: "Kendine mesaj gonderemezsin."
    });
    return;
  }

  const receiverUser = await prisma.user.findUnique({
    where: { id: receiverId },
    select: { id: true, role: true }
  });

  if (!receiverUser) {
    safeSend(ws, {
      type: "ws_error",
      code: "NOT_FOUND",
      message: "Alici bulunamadi."
    });
    return;
  }

  const message = await prisma.message.create({
    data: {
      senderId,
      receiverId,
      content
    },
    include: {
      sender: { select: { id: true, name: true, role: true } },
      receiver: { select: { id: true, name: true, role: true } }
    }
  });

  const notification = await prisma.notification.create({
    data: {
      userId: receiverId,
      title: `${message.sender.name} yeni mesaj gonderdi`,
      body: content.slice(0, 140),
      type: "DIRECT_MESSAGE"
    }
  });

  safeSend(ws, {
    type: "message_sent",
    clientId,
    message
  });

  sendToUser(senderId, { type: "new_message", message }, ws);
  sendToUser(receiverId, { type: "new_message", message });

  // Real-time notification event to receiver
  sendToUser(receiverId, {
    type: "notification_created",
    notification: {
      id: notification.id,
      title: notification.title,
      body: notification.body,
      type: notification.type,
      isRead: false,
      createdAt: notification.createdAt.toISOString()
    }
  });

  if (!isUserOnline(receiverId)) {
    const receiverMessagesPath = receiverUser.role === "COACH" ? "/coach/messages" : "/client/messages";
    await sendPushToUser(receiverId, {
      title: `${message.sender.name} yeni mesaj gonderdi`,
      body: content.slice(0, 140),
      url: `${receiverMessagesPath}?withUserId=${senderId}`
    });
  }
}

function startWsServer() {
  const server = http.createServer((req, res) => {
    if (req.url === "/health") {
      res.writeHead(200, { "content-type": "application/json" });
      res.end(JSON.stringify({ ok: true }));
      return;
    }

    // Internal endpoint — only accessible from localhost
    if (req.method === "POST" && req.url === "/internal/notify") {
      const remote = req.socket.remoteAddress || "";
      const isLocal =
        remote === "127.0.0.1" ||
        remote === "::1" ||
        remote === "::ffff:127.0.0.1";

      if (!isLocal) {
        res.writeHead(403, { "content-type": "application/json" });
        res.end(JSON.stringify({ error: "Forbidden" }));
        return;
      }

      let body = "";
      req.on("data", (chunk) => { body += chunk; });
      req.on("end", () => {
        try {
          const { userId, notification } = JSON.parse(body);
          if (userId && notification) {
            sendToUser(userId, { type: "notification_created", notification });
          }
        } catch { /* ignore parse errors */ }
        res.writeHead(200, { "content-type": "application/json" });
        res.end(JSON.stringify({ ok: true }));
      });
      return;
    }

    res.writeHead(404, { "content-type": "application/json" });
    res.end(JSON.stringify({ error: "Not found" }));
  });

  const wss = new WebSocketServer({ noServer: true });

  wss.on("connection", (ws, request, authPayload) => {
    const userId = authPayload.uid;
    addSocket(userId, ws);

    safeSend(ws, {
      type: "welcome",
      userId,
      sessionId: base64UrlEncode(`${userId}:${Date.now()}`)
    });

    // Notify all other connected users that this user came online
    for (const [otherUserId, sockets] of socketsByUserId.entries()) {
      if (otherUserId === userId) continue;
      for (const socket of sockets) {
        safeSend(socket, { type: "peer_online", userId });
      }
    }

    ws.on("message", async (raw) => {
      let parsed;
      try {
        parsed = JSON.parse(raw.toString("utf8"));
      } catch {
        safeSend(ws, {
          type: "ws_error",
          code: "INVALID_JSON",
          message: "Mesaj formati gecersiz."
        });
        return;
      }

      if (parsed?.type === "send_message") {
        try {
          await handleSendMessage(userId, ws, parsed);
        } catch {
          safeSend(ws, {
            type: "ws_error",
            code: "SEND_FAILED",
            message: "Mesaj gonderilemedi."
          });
        }
        return;
      }

      if (parsed?.type === "ping") {
        safeSend(ws, { type: "pong" });
        return;
      }

      if (parsed?.type === "query_peer_status") {
        const peerId = typeof parsed.peerId === "string" ? parsed.peerId : "";
        if (peerId) {
          safeSend(ws, { type: "peer_status", peerId, online: isUserOnline(peerId) });
        }
        return;
      }
    });

    ws.on("close", () => {
      removeSocket(userId, ws);
      // Notify all remaining connected users that this user went offline
      for (const [otherUserId, sockets] of socketsByUserId.entries()) {
        if (otherUserId === userId) continue;
        for (const socket of sockets) {
          safeSend(socket, { type: "peer_offline", userId });
        }
      }
    });

    ws.on("error", () => {
      removeSocket(userId, ws);
    });
  });

  server.on("upgrade", (request, socket, head) => {
    const host = request.headers.host || `localhost:${port}`;
    const url = new URL(request.url || "/", `http://${host}`);

    if (url.pathname !== "/ws") {
      socket.destroy();
      return;
    }

    const token = url.searchParams.get("token");
    const payload = verifyWsToken(token);

    if (!payload) {
      socket.destroy();
      return;
    }

    wss.handleUpgrade(request, socket, head, (ws) => {
      wss.emit("connection", ws, request, payload);
    });
  });

  server.listen(port, hostname, () => {
    console.log(`> WebSocket server ready on ws://${hostname}:${port}/ws`);
  });
}

startWsServer();

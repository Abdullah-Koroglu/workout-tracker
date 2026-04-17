import webpush from "web-push";

type PushPayload = {
  title: string;
  body: string;
  url?: string;
};

type StoredSubscription = {
  endpoint: string;
  expirationTime?: number | null;
  keys: {
    p256dh: string;
    auth: string;
  };
};

let configured = false;

function configureWebPush() {
  if (configured) {
    return;
  }

  const publicKey = process.env.VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  const subject = process.env.VAPID_SUBJECT || "mailto:support@example.com";

  if (!publicKey || !privateKey) {
    return;
  }

  webpush.setVapidDetails(subject, publicKey, privateKey);
  configured = true;
}

export function isPushConfigured() {
  configureWebPush();
  return configured;
}

function isValidSubscription(input: unknown): input is StoredSubscription {
  if (!input || typeof input !== "object") {
    return false;
  }

  const candidate = input as Partial<StoredSubscription>;
  return Boolean(
    candidate.endpoint &&
      candidate.keys?.auth &&
      candidate.keys?.p256dh
  );
}

export async function sendPushNotification(subscription: unknown, payload: PushPayload) {
  configureWebPush();
  if (!configured || !isValidSubscription(subscription)) {
    return { delivered: false, expired: false };
  }

  try {
    await webpush.sendNotification(subscription, JSON.stringify(payload));
    return { delivered: true, expired: false };
  } catch (error) {
    const statusCode = (error as { statusCode?: number })?.statusCode;
    const expired = statusCode === 404 || statusCode === 410;
    return { delivered: false, expired };
  }
}

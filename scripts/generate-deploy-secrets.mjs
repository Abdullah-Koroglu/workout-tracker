import crypto from "node:crypto";
import webpush from "web-push";

function randomSecret(size = 48) {
  return crypto.randomBytes(size).toString("base64url");
}

const vapidKeys = webpush.generateVAPIDKeys();

const output = {
  NEXTAUTH_SECRET: randomSecret(),
  NEXTAUTH_SECRET_STAGING: randomSecret(),
  WS_AUTH_SECRET: randomSecret(),
  CRON_SECRET: randomSecret(),
  NEXT_PUBLIC_VAPID_PUBLIC_KEY: vapidKeys.publicKey,
  VAPID_PUBLIC_KEY: vapidKeys.publicKey,
  VAPID_PRIVATE_KEY: vapidKeys.privateKey
};

process.stdout.write(
  [
    "# Paste these into .env.docker.prod and then fill the remaining placeholders manually.",
    `NEXTAUTH_SECRET=${output.NEXTAUTH_SECRET}`,
    `NEXTAUTH_SECRET_STAGING=${output.NEXTAUTH_SECRET_STAGING}`,
    `WS_AUTH_SECRET=${output.WS_AUTH_SECRET}`,
    `CRON_SECRET=${output.CRON_SECRET}`,
    `NEXT_PUBLIC_VAPID_PUBLIC_KEY=${output.NEXT_PUBLIC_VAPID_PUBLIC_KEY}`,
    `VAPID_PUBLIC_KEY=${output.VAPID_PUBLIC_KEY}`,
    `VAPID_PRIVATE_KEY=${output.VAPID_PRIVATE_KEY}`,
    "VAPID_SUBJECT=mailto:ops@example.com"
  ].join("\n") + "\n"
);

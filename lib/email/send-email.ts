import { render } from "@react-email/render";
import nodemailer from "nodemailer";
import type { ReactElement } from "react";

let transporter: nodemailer.Transporter | null = null;

function getTransporter() {
  if (transporter) {
    return transporter;
  }

  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT || 587);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !user || !pass) {
    return null;
  }

  transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: {
      user,
      pass
    }
  });

  return transporter;
}

export function isEmailConfigured() {
  return Boolean(getTransporter() && process.env.MAIL_FROM);
}

type SendTemplatedEmailInput = {
  to: string;
  subject: string;
  template: ReactElement;
};

export async function sendTemplatedEmail({ to, subject, template }: SendTemplatedEmailInput) {
  const currentTransporter = getTransporter();
  const from = process.env.MAIL_FROM;

  if (!currentTransporter || !from) {
    return { sent: false, reason: "not_configured" as const };
  }

  const html = await render(template);

  await currentTransporter.sendMail({
    from,
    to,
    subject,
    html
  });

  return { sent: true as const };
}

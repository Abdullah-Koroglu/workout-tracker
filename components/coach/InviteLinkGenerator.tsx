"use client";

import { useState } from "react";
import { Copy, Check, Link } from "lucide-react";

type Props = { inviteCode: string };

export function InviteLinkGenerator({ inviteCode }: Props) {
  const [copied, setCopied] = useState(false);

  const inviteUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/register?invite=${inviteCode}`
      : `/register?invite=${inviteCode}`;

  const copy = () => {
    navigator.clipboard.writeText(inviteUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div
      className="rounded-2xl p-4"
      style={{ background: "#F8FAFC", border: "1px solid #E2E8F0" }}
    >
      <div className="mb-2 flex items-center gap-2">
        <Link className="h-4 w-4 text-slate-400" />
        <p className="text-[11px] font-black uppercase tracking-wider text-slate-400">
          Danisan Davet Linki
        </p>
      </div>
      <p className="mb-3 text-xs leading-5 text-slate-500">
        Bu linki danisanlarinla paylas. Kayit olunca otomatik olarak paneline duser.
      </p>
      <div className="flex flex-col gap-2 sm:flex-row">
        <input
          readOnly
          value={inviteUrl}
          className="h-10 min-w-0 flex-1 rounded-xl bg-white px-3 text-xs text-slate-600 ring-1 ring-slate-200 focus:outline-none"
        />
        <button
          onClick={copy}
          className="flex h-10 w-full items-center justify-center gap-1.5 rounded-xl px-4 text-sm font-black text-white transition hover:opacity-90 sm:w-auto"
          style={{ background: "#1A365D" }}
        >
          {copied ? (
            <>
              <Check className="h-3.5 w-3.5" /> Kopyalandi
            </>
          ) : (
            <>
              <Copy className="h-3.5 w-3.5" /> Kopyala
            </>
          )}
        </button>
      </div>
    </div>
  );
}

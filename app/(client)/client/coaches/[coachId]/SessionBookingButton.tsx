"use client";

import { useState } from "react";
import { Calendar } from "lucide-react";
import { SessionBookingModal } from "@/components/client/SessionBookingModal";

interface Props {
  coachId: string;
  coachName: string;
}

export function SessionBookingButton({ coachId, coachName }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex w-full items-center justify-center gap-2 rounded-2xl py-3.5 text-sm font-black uppercase tracking-wider text-white transition-all hover:shadow-lg"
        style={{
          background: "linear-gradient(135deg, #1A365D, #2D4A7A)",
          boxShadow: "0 4px 14px rgba(26,54,93,0.3)",
        }}
      >
        <Calendar className="h-4 w-4" />
        Seans Planla
      </button>
      {open && (
        <SessionBookingModal
          coachId={coachId}
          coachName={coachName}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  );
}

"use client";

import { Button } from "@/components/ui/button";

type ConfirmationModalProps = {
  open: boolean;
  title: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
  danger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

export function ConfirmationModal({
  open,
  title,
  description,
  confirmText = "Onayla",
  cancelText = "Vazgec",
  danger = false,
  onConfirm,
  onCancel
}: ConfirmationModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-2xl border bg-background p-5 shadow-xl">
        <h2 className="text-lg font-semibold text-foreground">{title}</h2>
        {description ? <p className="mt-2 text-sm text-muted-foreground">{description}</p> : null}

        <div className="mt-5 flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onCancel}>
            {cancelText}
          </Button>
          <Button
            type="button"
            onClick={onConfirm}
            className={danger ? "bg-red-600 text-white hover:bg-red-700" : undefined}
          >
            {confirmText}
          </Button>
        </div>
      </div>
    </div>
  );
}

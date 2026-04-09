"use client";

import { createContext, useCallback, useContext, useRef, useState } from "react";

import { ConfirmationModal } from "@/components/ui/confirmation-modal";

type ConfirmOptions = {
  title: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
  danger?: boolean;
};

type ConfirmationContextValue = {
  confirm: (options: ConfirmOptions) => Promise<boolean>;
};

const ConfirmationContext = createContext<ConfirmationContextValue>({
  confirm: async () => false
});

export function ConfirmationProvider({ children }: { children: React.ReactNode }) {
  const resolverRef = useRef<((result: boolean) => void) | null>(null);
  const [options, setOptions] = useState<ConfirmOptions | null>(null);

  const confirm = useCallback((nextOptions: ConfirmOptions) => {
    setOptions(nextOptions);
    return new Promise<boolean>((resolve) => {
      resolverRef.current = resolve;
    });
  }, []);

  const close = useCallback((result: boolean) => {
    if (resolverRef.current) {
      resolverRef.current(result);
      resolverRef.current = null;
    }
    setOptions(null);
  }, []);

  return (
    <ConfirmationContext.Provider value={{ confirm }}>
      {children}
      <ConfirmationModal
        open={Boolean(options)}
        title={options?.title || ""}
        description={options?.description}
        confirmText={options?.confirmText}
        cancelText={options?.cancelText}
        danger={options?.danger}
        onConfirm={() => close(true)}
        onCancel={() => close(false)}
      />
    </ConfirmationContext.Provider>
  );
}

export function useConfirmation() {
  return useContext(ConfirmationContext);
}

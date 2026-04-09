"use client";

import { createContext, useContext, useState } from "react";
import { ToastStack } from "@/components/ui/toast-stack";

type NotificationType = "success" | "error" | "warning" | "info";

type Notification = {
  id: number;
  message: string;
  type: NotificationType;
};

const NotificationContext = createContext<{
  notifications: Notification[];
  push: (message: string, type?: NotificationType) => void;
  success: (message: string) => void;
  error: (message: string) => void;
  warning: (message: string) => void;
  info: (message: string) => void;
}>({
  notifications: [],
  push: () => undefined,
  success: () => undefined,
  error: () => undefined,
  warning: () => undefined,
  info: () => undefined,
});

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const push = (message: string, type: NotificationType = "info") => {
    const id = Date.now();
    setNotifications((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    }, 3500);
  };

  const success = (message: string) => push(message, "success");
  const error = (message: string) => push(message, "error");
  const warning = (message: string) => push(message, "warning");
  const info = (message: string) => push(message, "info");

  return (
    <NotificationContext.Provider
      value={{ notifications, push, success, error, warning, info }}
    >
      {children}
      <ToastStack toasts={notifications} />
    </NotificationContext.Provider>
  );
}

export function useNotificationContext() {
  return useContext(NotificationContext);
}

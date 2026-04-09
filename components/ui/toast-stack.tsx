import { AlertCircle, CheckCircle2, Info, XCircle } from "lucide-react";

type ToastType = "success" | "error" | "warning" | "info";

type ToastItem = {
  id: number;
  message: string;
  type: ToastType;
};

function getToastStyles(type: ToastType) {
  switch (type) {
    case "success":
      return {
        bg: "bg-green-50 dark:bg-green-900/20",
        text: "text-green-800 dark:text-green-200",
        border: "border-green-200 dark:border-green-800",
        icon: CheckCircle2,
        iconColor: "text-green-600 dark:text-green-400"
      };
    case "error":
      return {
        bg: "bg-red-50 dark:bg-red-900/20",
        text: "text-red-800 dark:text-red-200",
        border: "border-red-200 dark:border-red-800",
        icon: XCircle,
        iconColor: "text-red-600 dark:text-red-400"
      };
    case "warning":
      return {
        bg: "bg-yellow-50 dark:bg-yellow-900/20",
        text: "text-yellow-800 dark:text-yellow-200",
        border: "border-yellow-200 dark:border-yellow-800",
        icon: AlertCircle,
        iconColor: "text-yellow-600 dark:text-yellow-400"
      };
    default:
      return {
        bg: "bg-blue-50 dark:bg-blue-900/20",
        text: "text-blue-800 dark:text-blue-200",
        border: "border-blue-200 dark:border-blue-800",
        icon: Info,
        iconColor: "text-blue-600 dark:text-blue-400"
      };
  }
}

export function ToastStack({ toasts }: { toasts: ToastItem[] }) {
  return (
    <div className="fixed bottom-4 right-4 z-50 space-y-2 pointer-events-none">
      {toasts.map((toast) => {
        const styles = getToastStyles(toast.type);
        const Icon = styles.icon;

        return (
          <div
            key={toast.id}
            className={`flex items-start gap-3 rounded-lg border px-4 py-3 shadow-lg pointer-events-auto animate-in fade-in slide-in-from-bottom-4 transition-all ${styles.bg} ${styles.text} ${styles.border}`}
          >
            <Icon className={`mt-0.5 h-5 w-5 flex-shrink-0 ${styles.iconColor}`} />
            <p className="text-sm font-medium">{toast.message}</p>
          </div>
        );
      })}
    </div>
  );
}

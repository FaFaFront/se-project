"use client";

import { AlertCircle, CheckCircle2, X } from "lucide-react";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";

import { cn } from "@/lib/utils";

type ToastVariant = "success" | "error";

type Toast = {
  id: number;
  message: string;
  variant: ToastVariant;
  /** True once this toast should be animating out, just before removal. */
  closing: boolean;
};

export interface ToastContextValue {
  /** Shows a toast in the bottom-right corner; auto-dismisses after a few seconds. */
  showToast: (message: string, variant?: ToastVariant) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const AUTO_DISMISS_MS = 4000;
// Must match the transition duration on ToastItem below.
const EXIT_DURATION_MS = 200;

function ToastItem({
  toast,
  onRequestClose,
  onExited,
}: {
  toast: Toast;
  onRequestClose: (id: number) => void;
  onExited: (id: number) => void;
}) {
  const [entered, setEntered] = useState(false);
  const isSuccess = toast.variant === "success";

  useEffect(() => {
    const raf = requestAnimationFrame(() => setEntered(true));
    return () => cancelAnimationFrame(raf);
  }, []);

  useEffect(() => {
    if (!toast.closing) return;
    const timeout = setTimeout(() => onExited(toast.id), EXIT_DURATION_MS);
    return () => clearTimeout(timeout);
  }, [toast.closing, toast.id, onExited]);

  return (
    <div
      role="status"
      className={cn(
        "border-hairline bg-canvas gap-sm flex items-start justify-between rounded-xl border border-l-4 px-4 py-3 text-sm shadow-lg transition-all duration-200 ease-out",
        isSuccess ? "border-l-success" : "border-l-error",
        entered && !toast.closing
          ? "translate-y-0 scale-100 opacity-100"
          : "translate-y-2 scale-95 opacity-0"
      )}
    >
      <div className="gap-sm flex min-w-0 items-start">
        {isSuccess ? (
          <CheckCircle2 aria-hidden="true" className="text-success size-5 shrink-0" />
        ) : (
          <AlertCircle aria-hidden="true" className="text-error size-5 shrink-0" />
        )}
        <span className="text-ink-black min-w-0 break-words">{toast.message}</span>
      </div>
      <button
        type="button"
        onClick={() => onRequestClose(toast.id)}
        aria-label="Dismiss notification"
        className="text-ink/50 hover:text-ink shrink-0 transition-colors"
      >
        <X aria-hidden="true" className="size-4" />
      </button>
    </div>
  );
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const nextId = useRef(0);

  const requestClose = useCallback((id: number) => {
    setToasts((current) =>
      current.map((toast) => (toast.id === id ? { ...toast, closing: true } : toast))
    );
  }, []);

  const removeToast = useCallback((id: number) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const showToast = useCallback(
    (message: string, variant: ToastVariant = "success") => {
      const id = nextId.current++;
      setToasts((current) => [...current, { id, message, variant, closing: false }]);
      setTimeout(() => requestClose(id), AUTO_DISMISS_MS);
    },
    [requestClose]
  );

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div
        aria-live="polite"
        aria-atomic="true"
        className="gap-sm fixed right-4 bottom-4 z-[100] flex w-[calc(100%-2rem)] max-w-sm flex-col sm:right-6 sm:bottom-6"
      >
        {toasts.map((toast) => (
          <ToastItem
            key={toast.id}
            toast={toast}
            onRequestClose={requestClose}
            onExited={removeToast}
          />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const context = useContext(ToastContext);
  if (!context) throw new Error("useToast must be used within a ToastProvider");
  return context;
}

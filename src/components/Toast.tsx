import { CircleAlert, CircleCheck, Info, TriangleAlert } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { spring, fade } from "@/lib/motion";
import { cn } from "@/lib/cn";
import { ToastContext, type ToastApi, type ToastOptions } from "./toast-context";

const ICONS = {
  success: { Icon: CircleCheck, className: "text-positive" },
  info: { Icon: Info, className: "text-text-2" },
  warning: { Icon: TriangleAlert, className: "text-warning" },
  error: { Icon: CircleAlert, className: "text-negative" },
} as const;

interface ActiveToast extends ToastOptions {
  id: number;
}

/**
 * Shows one toast at a time, above the tab bar (PRD §10.5 Toast with Undo).
 * `show` replaces whatever is showing; `queue` waits its turn.
 */
export function ToastProvider({ children }: { children: React.ReactNode }) {
  // The first toast is showing; the rest are waiting their turn
  const [toasts, setToasts] = useState<ActiveToast[]>([]);
  const toast = toasts[0] ?? null;
  const nextId = useRef(1);
  const reduceMotion = useReducedMotion() ?? false;

  const dismiss = useCallback(() => {
    setToasts((list) => list.slice(1));
  }, []);
  const show = useCallback((options: ToastOptions) => {
    setToasts([{ ...options, id: nextId.current++ }]);
  }, []);
  const queue = useCallback((options: ToastOptions) => {
    const next = { ...options, id: nextId.current++ };
    setToasts((list) => [...list, next]);
  }, []);
  const api = useMemo<ToastApi>(() => ({ show, queue, dismiss }), [show, queue, dismiss]);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(dismiss, toast.duration ?? 5000);
    return () => {
      window.clearTimeout(timer);
    };
  }, [toast, dismiss]);

  const icon = ICONS[toast?.tone ?? "success"];

  return (
    <ToastContext value={api}>
      {children}
      <div
        aria-live="polite"
        className="toast-region pointer-events-none fixed inset-x-0 z-60 flex justify-center px-screen"
      >
        <AnimatePresence mode="wait">
          {toast && (
            <motion.div
              key={toast.id}
              role="status"
              initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 24, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 12, scale: 0.98 }}
              transition={reduceMotion ? fade : spring}
              className="pointer-events-auto flex border border-hairline-strong bg-surface-2/95 backdrop-blur-xl min-h-14 w-full max-w-[400px] items-center gap-3 rounded-pill py-1.5 pr-1.5 pl-4"
            >
              <icon.Icon
                aria-hidden="true"
                className={cn("size-5 shrink-0", icon.className)}
                strokeWidth={2}
              />
              <span className="min-w-0 flex-1 text-callout text-text-1">{toast.message}</span>
              {toast.action && (
                <button
                  type="button"
                  onClick={() => {
                    toast.action?.onAction();
                    dismiss();
                  }}
                  className="h-11 shrink-0 rounded-pill bg-surface-3 px-4 text-callout font-semibold text-text-1"
                >
                  {toast.action.label}
                </button>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </ToastContext>
  );
}

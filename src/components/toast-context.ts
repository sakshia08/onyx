import { createContext, useContext } from "react";

export interface ToastOptions {
  message: string;
  /** e.g. { label: "Undo", onAction: () => … } */
  action?: { label: string; onAction: () => void };
  tone?: "success" | "info" | "warning" | "error";
  /** Milliseconds. Default 5000 (PRD §8.4: Undo for 5 seconds). */
  duration?: number;
}

export interface ToastApi {
  show: (options: ToastOptions) => void;
  dismiss: () => void;
}

export const ToastContext = createContext<ToastApi | null>(null);

export function useToast(): ToastApi {
  const api = useContext(ToastContext);
  if (!api) throw new Error("useToast must be used inside <ToastProvider>");
  return api;
}

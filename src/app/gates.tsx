import { Navigate } from "react-router";
import { useAppStore } from "@/store";

/** Screens that need a month: before the first setup, go to Welcome (PRD §8.1). */
export function RequireMonth({ children }: { children: React.ReactNode }) {
  const active = useAppStore((s) => s.data.activeMonthKey);
  return active === null ? <Navigate to="/welcome" replace /> : <>{children}</>;
}

/** Welcome and first setup: once a month has started, go Home. */
export function RequireNoMonth({ children }: { children: React.ReactNode }) {
  const active = useAppStore((s) => s.data.activeMonthKey);
  return active === null ? <>{children}</> : <Navigate to="/" replace />;
}

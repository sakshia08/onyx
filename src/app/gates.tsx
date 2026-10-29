import { Navigate } from "react-router";
import { appStage, type AppStage } from "@/domain/rollover";
import { useAppStore } from "@/store";

const HOME_OF: Record<AppStage, string> = {
  welcome: "/welcome",
  recap: "/recap",
  setup: "/setup",
  month: "/",
};

/**
 * Keeps each screen to the right stage (PRD §8.8): a fresh install goes to Welcome, a month
 * that has just closed goes to its recap, then setup, and only then back to the month.
 */
export function StageGate({ allow, children }: { allow: AppStage[]; children: React.ReactNode }) {
  const stage = useAppStore((s) => appStage(s.data));
  return allow.includes(stage) ? <>{children}</> : <Navigate to={HOME_OF[stage]} replace />;
}

/** Screens of the month itself: Home, buckets, activity, piggies… */
export function RequireMonth({ children }: { children: React.ReactNode }) {
  return <StageGate allow={["month"]}>{children}</StageGate>;
}

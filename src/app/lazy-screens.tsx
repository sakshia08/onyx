import { lazy, Suspense } from "react";

// Less-used screens load when first opened, so everyday launches stay light (PRD §12.4)
export const Welcome = lazy(() =>
  import("@/features/onboarding/Welcome").then((m) => ({ default: m.Welcome })),
);
export const SetupFlow = lazy(() =>
  import("@/features/setup/SetupFlow").then((m) => ({ default: m.SetupFlow })),
);
export const BucketDetail = lazy(() =>
  import("@/features/buckets/BucketDetail").then((m) => ({ default: m.BucketDetail })),
);
export const ActivityScreen = lazy(() =>
  import("@/features/activity/ActivityScreen").then((m) => ({ default: m.ActivityScreen })),
);

export const PiggyScreen = lazy(() =>
  import("@/features/piggy/PiggyScreen").then((m) => ({ default: m.PiggyScreen })),
);
export const PiggyDetail = lazy(() =>
  import("@/features/piggy/PiggyDetail").then((m) => ({ default: m.PiggyDetail })),
);
export const PiggyEditor = lazy(() =>
  import("@/features/piggy/PiggyEditor").then((m) => ({ default: m.PiggyEditor })),
);

export const RecapFlow = lazy(() =>
  import("@/features/recap/RecapFlow").then((m) => ({ default: m.RecapFlow })),
);
export const RecapReview = lazy(() =>
  import("@/features/recap/RecapFlow").then((m) => ({ default: m.RecapReview })),
);
export const LeftoverStep = lazy(() =>
  import("@/features/recap/LeftoverStep").then((m) => ({ default: m.LeftoverStep })),
);
export const RecurringScreen = lazy(() =>
  import("@/features/recurring/RecurringScreen").then((m) => ({ default: m.RecurringScreen })),
);
export const RuleEditor = lazy(() =>
  import("@/features/recurring/RuleEditor").then((m) => ({ default: m.RuleEditor })),
);
export const SettingsScreen = lazy(() =>
  import("@/features/settings/SettingsScreen").then((m) => ({ default: m.SettingsScreen })),
);

export function Lazy({ children }: { children: React.ReactNode }) {
  return <Suspense fallback={null}>{children}</Suspense>;
}

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

export function Lazy({ children }: { children: React.ReactNode }) {
  return <Suspense fallback={null}>{children}</Suspense>;
}

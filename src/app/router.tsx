import { createHashRouter, type RouteObject } from "react-router";
import { BucketDetail } from "@/features/buckets/BucketDetail";
import { HomeScreen } from "@/features/home/HomeScreen";
import { Welcome } from "@/features/onboarding/Welcome";
import { SetupFlow } from "@/features/setup/SetupFlow";
import { AppShell } from "./AppShell";
import { RequireMonth, RequireNoMonth } from "./gates";
import { PlaceholderScreen } from "./PlaceholderScreen";

// Dev-only pages; production builds leave them out entirely.
const devRoutes: RouteObject[] = import.meta.env.DEV
  ? [
      {
        path: "/design",
        lazy: async () => ({
          Component: (await import("@/features/design-preview/DesignPreview")).DesignPreview,
        }),
      },
      {
        path: "/design/home",
        lazy: async () => ({
          Component: (await import("@/features/design-preview/HomeMockup")).HomeMockup,
        }),
      },
      {
        path: "/dev/seed",
        lazy: async () => ({
          Component: (await import("@/features/dev/SeedRoute")).SeedRoute,
        }),
      },
    ]
  : [];

// Hash routing (PRD §9) so the app works on any static host.
export const router = createHashRouter([
  {
    path: "/welcome",
    element: (
      <RequireNoMonth>
        <Welcome />
      </RequireNoMonth>
    ),
  },
  {
    path: "/setup",
    element: (
      <RequireNoMonth>
        <SetupFlow />
      </RequireNoMonth>
    ),
  },
  {
    path: "/",
    element: (
      <RequireMonth>
        <AppShell />
      </RequireMonth>
    ),
    children: [
      { index: true, element: <HomeScreen /> },
      { path: "bucket/:id", element: <BucketDetail /> },
      { path: "insights", element: <PlaceholderScreen title="Insights" phase={7} /> },
      { path: "piggy", element: <PlaceholderScreen title="Piggy" phase={5} glow="piggy" /> },
      { path: "settings", element: <PlaceholderScreen title="Settings" phase={8} /> },
    ],
  },
  ...devRoutes,
]);

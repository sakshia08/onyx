import { createHashRouter, type RouteObject } from "react-router";
import { HomeScreen } from "@/features/home/HomeScreen";
import { ActivityScreen, BucketDetail, Lazy, SetupFlow, Welcome } from "./lazy-screens";
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
        <Lazy>
          <Welcome />
        </Lazy>
      </RequireNoMonth>
    ),
  },
  {
    path: "/setup",
    element: (
      <RequireNoMonth>
        <Lazy>
          <SetupFlow />
        </Lazy>
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
      {
        path: "bucket/:id",
        element: (
          <Lazy>
            <BucketDetail />
          </Lazy>
        ),
      },
      {
        path: "activity",
        element: (
          <Lazy>
            <ActivityScreen />
          </Lazy>
        ),
      },
      { path: "insights", element: <PlaceholderScreen title="Insights" phase={7} /> },
      { path: "piggy", element: <PlaceholderScreen title="Piggy" phase={5} glow="piggy" /> },
      { path: "settings", element: <PlaceholderScreen title="Settings" phase={8} /> },
    ],
  },
  ...devRoutes,
]);

import { createHashRouter, type RouteObject } from "react-router";
import { AppShell } from "./AppShell";
import { PlaceholderScreen } from "./PlaceholderScreen";

// The design preview only exists on the dev server; production builds leave it out entirely.
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
    ]
  : [];

// Hash routing (PRD §9) so the app works on any static host.
export const router = createHashRouter([
  {
    path: "/",
    Component: AppShell,
    children: [
      { index: true, element: <PlaceholderScreen title="Home" phase={2} /> },
      { path: "insights", element: <PlaceholderScreen title="Insights" phase={7} /> },
      { path: "piggy", element: <PlaceholderScreen title="Piggy" phase={5} glow="piggy" /> },
      { path: "settings", element: <PlaceholderScreen title="Settings" phase={8} /> },
    ],
  },
  ...devRoutes,
]);

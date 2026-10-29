import { createHashRouter, type RouteObject } from "react-router";
import { HomeScreen } from "@/features/home/HomeScreen";
import {
  ActivityScreen,
  BackupScreen,
  FavoritesScreen,
  PinSettings,
  BucketDetail,
  InsightsScreen,
  MonthDetail,
  SearchScreen,
  Lazy,
  PiggyDetail,
  PiggyEditor,
  PiggyScreen,
  RecapFlow,
  RecapReview,
  LeftoverStep,
  RecurringScreen,
  RuleEditor,
  SettingsScreen,
  SetupFlow,
  Welcome,
} from "./lazy-screens";
import { AppShell } from "./AppShell";
import { RequireMonth, StageGate } from "./gates";

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
      <StageGate allow={["welcome"]}>
        <Lazy>
          <Welcome />
        </Lazy>
      </StageGate>
    ),
  },
  {
    path: "/setup",
    element: (
      <StageGate allow={["welcome", "setup"]}>
        <Lazy>
          <SetupFlow />
        </Lazy>
      </StageGate>
    ),
  },
  // Month end: the recap, then leftover to piggy, then setup (PRD §8.8)
  {
    path: "/recap",
    element: (
      <StageGate allow={["recap"]}>
        <Lazy>
          <RecapFlow />
        </Lazy>
      </StageGate>
    ),
  },
  {
    path: "/recap/leftover",
    element: (
      <StageGate allow={["recap"]}>
        <Lazy>
          <LeftoverStep />
        </Lazy>
      </StageGate>
    ),
  },
  // A past month's recap, reopened (PRD §8.8: "Recaps are saved and can be reopened")
  {
    path: "/recap/:key",
    element: (
      <RequireMonth>
        <Lazy>
          <RecapReview />
        </Lazy>
      </RequireMonth>
    ),
  },
  // Leftover from any closed month, from Insights (PRD §8.9)
  {
    path: "/leftover/:key",
    element: (
      <RequireMonth>
        <Lazy>
          <LeftoverStep />
        </Lazy>
      </RequireMonth>
    ),
  },
  // Recurring expenses (PRD §8.7): full screens, no tab bar
  ...["/recurring/new", "/recurring/:id"].map((path) => ({
    path,
    element: (
      <RequireMonth>
        <Lazy>
          <RuleEditor />
        </Lazy>
      </RequireMonth>
    ),
  })),
  // Creating and editing a piggy: full screen, no tab bar
  ...["/piggy/new", "/piggy/:id/edit"].map((path) => ({
    path,
    element: (
      <RequireMonth>
        <Lazy>
          <PiggyEditor />
        </Lazy>
      </RequireMonth>
    ),
  })),
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
      {
        path: "insights",
        element: (
          <Lazy>
            <InsightsScreen />
          </Lazy>
        ),
      },
      {
        path: "search",
        element: (
          <Lazy>
            <SearchScreen />
          </Lazy>
        ),
      },
      {
        path: "month/:key",
        element: (
          <Lazy>
            <MonthDetail />
          </Lazy>
        ),
      },
      {
        path: "piggy",
        element: (
          <Lazy>
            <PiggyScreen />
          </Lazy>
        ),
      },
      {
        path: "piggy/:id",
        element: (
          <Lazy>
            <PiggyDetail />
          </Lazy>
        ),
      },
      {
        path: "settings",
        element: (
          <Lazy>
            <SettingsScreen />
          </Lazy>
        ),
      },
      ...(
        [
          ["settings/pin", <PinSettings key="pin" />],
          ["settings/backup", <BackupScreen key="backup" />],
          ["settings/favorites", <FavoritesScreen key="favorites" />],
        ] as const
      ).map(([path, screen]) => ({ path, element: <Lazy>{screen}</Lazy> })),
      {
        path: "recurring",
        element: (
          <Lazy>
            <RecurringScreen />
          </Lazy>
        ),
      },
    ],
  },
  ...devRoutes,
]);

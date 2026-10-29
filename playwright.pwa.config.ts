import { defineConfig } from "@playwright/test";

/** Tests against the real production build (service worker, offline, install guide). */
export default defineConfig({
  testDir: "tests/pwa",
  outputDir: "test-results/pwa",
  workers: 1,
  timeout: 90_000,
  reporter: [["list"]],
  use: {
    baseURL: "http://localhost:4173",
    browserName: "webkit",
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
    colorScheme: "dark",
    serviceWorkers: "allow",
  },
  webServer: {
    command: "npm run build && npx vite preview --port 4173 --strictPort",
    url: "http://localhost:4173",
    reuseExistingServer: false,
    timeout: 180_000,
  },
});

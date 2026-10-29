import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { expect, test } from "@playwright/test";
import { simulateIPhone } from "../e2e/iphone";
import { quickSetup } from "./setup";

/*
 * Offline support (PRD §12.3). Playwright's test browsers don't keep a real cache store,
 * so a full airplane-mode reload can't be faked here; that's checked on the iPhone
 * (PROGRESS, Phase 4). These tests check the two things it depends on.
 */

test("the service worker precaches every file the app is built from", () => {
  const dist = "dist";
  const sw = readFileSync(join(dist, "sw.js"), "utf8");
  const precached = new Set([...sw.matchAll(/url:"([^"]+)"/g)].map((m) => m[1]));
  const needed = [
    "index.html",
    "manifest.webmanifest",
    ...readdirSync(join(dist, "assets"))
      .filter((f) => /\.(js|css|woff2)$/.test(f))
      .map((f) => `assets/${f}`),
  ];
  expect(needed.filter((f) => !precached.has(f))).toEqual([]);
  // Every page load falls back to the cached app (so deep links work offline too)
  expect(sw).toMatch(/NavigationRoute\(\w+\.createHandlerBoundToURL\("index\.html"\)\)/);
});

test("the service worker takes control after the first visit", async ({ page }) => {
  await simulateIPhone(page);
  await quickSetup(page);
  await page.waitForFunction(async () => {
    const reg = await navigator.serviceWorker.getRegistration();
    return reg?.active?.state === "activated";
  });
  await page.reload();
  await page.waitForFunction(() => navigator.serviceWorker.controller !== null);
  expect(await page.evaluate(() => navigator.serviceWorker.controller?.scriptURL)).toContain(
    "/sw.js",
  );
});

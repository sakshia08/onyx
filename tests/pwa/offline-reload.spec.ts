import { expect, test } from "@playwright/test";
import { simulateIPhone } from "../e2e/iphone";
import { quickSetup } from "./setup";

// The real thing: no network at all, then reload. Chromium runs the same service worker;
// Playwright's Linux WebKit can't reload through one while offline.
test.use({ browserName: "chromium" });

test("Onyx opens with no network after the first visit (PRD §12.3)", async ({ page, context }) => {
  await simulateIPhone(page);
  await quickSetup(page);
  await page.waitForFunction(async () => {
    const reg = await navigator.serviceWorker.getRegistration();
    return reg?.active?.state === "activated";
  });
  await page.reload();
  await page.waitForFunction(() => navigator.serviceWorker.controller !== null);
  // Settings → About says so
  await page.getByRole("link", { name: "Settings" }).click();
  await expect(page.getByText("Ready", { exact: true })).toBeVisible();
  await page.getByRole("link", { name: "Home" }).click();

  await context.setOffline(true);
  await page.reload();
  await expect(page.getByRole("region", { name: "This month" })).toContainText("20,000");
  // Screens that load on demand open offline too
  await page
    .getByRole("region", { name: "Spend buckets" })
    .getByRole("button", { name: /Food/ })
    .click();
  await expect(page.getByRole("heading", { name: "Food" })).toBeVisible();
  await page.getByRole("link", { name: "Insights" }).click();
  await expect(page.getByRole("heading", { name: "Insights" })).toBeVisible();
  await context.setOffline(false);
});

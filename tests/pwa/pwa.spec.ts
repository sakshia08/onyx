import { expect, test } from "@playwright/test";
import { simulateIPhone } from "../e2e/iphone";
import { quickSetup } from "./setup";

const DIR = "screenshots/phase-4";

test("the manifest and iPhone icons are in place", async ({ page, request }) => {
  await page.goto("/");
  const manifest = (await (await request.get("/manifest.webmanifest")).json()) as {
    name: string;
    display: string;
    background_color: string;
    icons: { src: string }[];
  };
  expect(manifest).toMatchObject({
    name: "Onyx",
    display: "standalone",
    background_color: "#09090b",
  });
  for (const icon of manifest.icons) expect((await request.get(`/${icon.src}`)).ok()).toBe(true);
  const touchIcon = await page.locator('link[rel="apple-touch-icon"]').getAttribute("href");
  expect(touchIcon).not.toBeNull();
  expect((await request.get(touchIcon ?? "")).ok()).toBe(true);
  expect(await page.locator('link[rel="apple-touch-startup-image"]').count()).toBeGreaterThan(10);
});

test.describe("install guide in iPhone Safari (PRD §8.1)", () => {
  test.use({
    userAgent:
      "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1",
  });

  test("shows once, and 'Continue in browser' skips it for good", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { name: "Add Onyx to your Home Screen" })).toBeVisible();
    await page.waitForTimeout(400);
    await page.screenshot({ path: `${DIR}/install-guide-390.png` });
    await page.getByRole("button", { name: "Continue in browser" }).click();
    await expect(page.getByRole("heading", { name: "Onyx" })).toBeVisible();
    await page.reload();
    await expect(page.getByRole("heading", { name: "Onyx" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Add Onyx to your Home Screen" })).toHaveCount(
      0,
    );
  });
});

test("no network requests to anywhere else (PRD §12.4)", async ({ page }) => {
  const outside: string[] = [];
  page.on("request", (r) => {
    if (!r.url().startsWith("http://localhost:4173")) outside.push(r.url());
  });
  await simulateIPhone(page);
  await quickSetup(page);
  await page.waitForTimeout(1000);
  expect(outside).toEqual([]);
});

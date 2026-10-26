import { expect, test } from "@playwright/test";
import { settle, simulateIPhone, WIDTHS } from "./iphone";

const DIR = "screenshots/phase-1";

test.beforeEach(async ({ page }) => {
  await simulateIPhone(page);
});

for (const width of WIDTHS) {
  test(`design preview, full page at ${width}`, async ({ page }) => {
    await page.setViewportSize({ width, height: 844 });
    await page.goto("/#/design");
    await expect(page.getByRole("heading", { name: "Design preview" })).toBeVisible();
    await settle(page);
    await page.screenshot({ path: `${DIR}/design-full-${width}.png`, fullPage: true });
  });

  test(`home mockup at ${width}`, async ({ page }) => {
    await page.setViewportSize({ width, height: 844 });
    await page.goto("/#/design/home");
    await settle(page);
    await page.waitForTimeout(800);
    await page.screenshot({ path: `${DIR}/home-mockup-${width}.png` });
    if (width === 390) {
      await page.evaluate(() => {
        window.scrollTo(0, 640);
      });
      await page.waitForTimeout(500);
      await page.screenshot({ path: `${DIR}/home-mockup-scrolled-390.png` });
    }
  });

  test(`home placeholder and tab bar at ${width}`, async ({ page }) => {
    await page.setViewportSize({ width, height: 844 });
    await page.goto("/#/");
    await settle(page);
    await page.screenshot({ path: `${DIR}/home-${width}.png` });
  });
}

test("design preview, screen by screen at 390", async ({ page }) => {
  await page.goto("/#/design");
  await settle(page);
  for (const id of ["colors", "type", "controls", "home", "entries", "keypad", "pig"]) {
    await page.locator(`#${id}`).evaluate((el) => {
      el.scrollIntoView({ block: "start" });
    });
    await page.waitForTimeout(500);
    await page.screenshot({ path: `${DIR}/design-${id}-390.png` });
  }
});

test("bottom sheet open at 390", async ({ page }) => {
  await page.goto("/#/design");
  await settle(page);
  await page.getByRole("button", { name: "Add expense" }).click();
  await page.getByRole("button", { name: "Food", exact: false }).last().click();
  for (const key of ["2", "5", "0", "plus", "1", "8", "0"]) {
    await page.getByRole("button", { name: key, exact: true }).last().click();
  }
  await page.waitForTimeout(600);
  await page.screenshot({ path: `${DIR}/sheet-390.png` });
});

test("over budget and spending at 390", async ({ page }) => {
  await page.goto("/#/design");
  await settle(page);
  await page.locator("#home").evaluate((el) => {
    el.scrollIntoView({ block: "start" });
  });
  await page.getByRole("button", { name: "Over budget" }).click();
  await page.getByRole("button", { name: "Spend ₹500 on Food" }).click();
  await page.getByRole("button", { name: "Put ₹500 in Investing" }).click();
  await page.waitForTimeout(1400);
  await page.screenshot({ path: `${DIR}/home-vials-after-390.png` });
  await page.getByRole("region", { name: "This month" }).screenshot({
    path: `${DIR}/home-tank-over-budget-390.png`,
  });
});

test("toast at 390", async ({ page }) => {
  await page.goto("/#/design");
  await settle(page);
  await page.getByRole("button", { name: "Show toast with Undo" }).click();
  await page.waitForTimeout(600);
  await page.screenshot({ path: `${DIR}/toast-390.png` });
});

test("pig states at 390", async ({ page }) => {
  await page.goto("/#/design");
  await settle(page);
  const pig = page.locator("#pig");
  await pig.evaluate((el) => {
    el.scrollIntoView({ block: "start" });
  });
  await page.getByRole("button", { name: "Sleep" }).click();
  await page.waitForTimeout(900);
  await page.screenshot({ path: `${DIR}/pig-sleeping-390.png` });
});

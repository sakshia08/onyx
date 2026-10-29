import { expect, test, type Page } from "@playwright/test";
import { settle, simulateIPhone } from "./iphone";

/** Changes from the first test on the iPhone (PROGRESS: "Phone feedback 1"). */
const DIR = "screenshots/phase-4";

test.beforeEach(async ({ page }) => {
  await simulateIPhone(page);
  await page.clock.setFixedTime(new Date(2026, 10, 18, 20, 0));
  await page.goto("/#/dev/seed");
  await expect(page.getByRole("heading", { name: "November" })).toBeVisible();
  await settle(page);
});

async function swipeLeft(page: Page, name: RegExp, distance: number) {
  const row = page.getByRole("button", { name }).first();
  // Keep the row clear of the floating tab bar before swiping
  await row.evaluate((el) => {
    el.scrollIntoView({ block: "center" });
  });
  await page.waitForTimeout(300);
  const box = await row.boundingBox();
  if (!box) throw new Error("row not found");
  const y = box.y + box.height / 2;
  await page.mouse.move(box.x + box.width - 20, y);
  await page.mouse.down();
  for (let i = 1; i <= 10; i++)
    await page.mouse.move(box.x + box.width - 20 - (distance * i) / 10, y);
  await page.mouse.up();
  await page.waitForTimeout(400);
}

const tank = (page: Page) => page.getByRole("region", { name: "This month" });

test("swipe left on a Recent entry to reveal Delete, with Undo", async ({ page }) => {
  await page.evaluate(() => {
    window.scrollTo(0, document.body.scrollHeight);
  });
  await page.waitForTimeout(400);
  await swipeLeft(page, /Dinner with friends/, 110);
  const del = page.getByRole("button", { name: "Delete Dinner with friends" });
  await expect(del).toBeVisible();
  await page.screenshot({ path: `${DIR}/swipe-reveal-390.png` });

  // Tapping the open row closes it rather than opening the editor
  await page.getByRole("button", { name: /^Dinner with friends/ }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);

  await swipeLeft(page, /Dinner with friends/, 110);
  await del.click();
  await expect(page.getByText("Entry deleted")).toBeVisible();
  await expect(tank(page)).toContainText("15,100"); // ₹13,850 + ₹1,250
  await page.getByRole("button", { name: "Undo" }).click();
  await expect(tank(page)).toContainText("13,850");
});

test("a full swipe deletes straight away, inside a bucket too", async ({ page }) => {
  await page
    .getByRole("region", { name: "Spend buckets" })
    .getByRole("button", { name: /Leisure/ })
    .click();
  await expect(page.getByRole("heading", { name: "Leisure" })).toBeVisible();
  await swipeLeft(page, /Concert tickets/, 300);
  await expect(page.getByText("Entry deleted")).toBeVisible();
  await expect(page.getByRole("button", { name: /Concert tickets/ })).toHaveCount(0);
  await expect(page.getByRole("region", { name: "Leisure this month" })).toContainText("1,351");
});

test("the month's budget can be changed after the month starts", async ({ page }) => {
  await page.getByRole("button", { name: "Change this month's budget" }).click();
  const dialog = page.getByRole("dialog", { name: "November budget" });
  await expect(dialog).toBeVisible();
  await expect(dialog).toContainText("60,000");
  for (const d of "65000") await dialog.getByRole("button", { name: d, exact: true }).click();
  await expect(dialog).toContainText("unallocated");
  await page.waitForTimeout(300);
  await page.screenshot({ path: `${DIR}/edit-budget-390.png` });
  await dialog.getByRole("button", { name: "Save", exact: true }).click();
  await expect(page.getByText("Budget is now ₹65,000")).toBeVisible();
  await expect(tank(page)).toContainText("18,850");
  await page.getByRole("button", { name: "Undo" }).click();
  await expect(tank(page)).toContainText("13,850");
});

test("a named entry shows its name, not the bucket", async ({ page }) => {
  await page
    .getByRole("region", { name: "Spend buckets" })
    .getByRole("button", { name: /Food/ })
    .click();
  await page.getByRole("button", { name: "Add expense" }).click();
  const sheet = page.getByRole("dialog");
  await expect(sheet).toBeVisible();
  for (const d of "500") await sheet.getByRole("button", { name: d, exact: true }).click();
  await sheet.getByPlaceholder(/What was it/).fill("Starbucks");
  await page.waitForTimeout(200);
  await page.screenshot({ path: `${DIR}/named-entry-390.png` });
  await sheet.getByRole("button", { name: "Save", exact: true }).click();
  await expect(page.getByText("Starbucks ₹500 logged to Food")).toBeVisible();
  const row = page.getByRole("button", { name: /Starbucks/ }).first();
  await expect(row).toContainText("Starbucks");
  await expect(row).toContainText("Food");
});

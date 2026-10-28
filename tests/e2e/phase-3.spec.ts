import { expect, test, type Page } from "@playwright/test";
import { settle, simulateIPhone, WIDTHS } from "./iphone";

const DIR = "screenshots/phase-3";
const MID_NOVEMBER = new Date(2026, 10, 18, 20, 0);

test.beforeEach(async ({ page }) => {
  await simulateIPhone(page);
  await page.clock.setFixedTime(MID_NOVEMBER);
});

const KEY_NAMES: Record<string, string> = { "+": "plus", "-": "minus", ".": "decimal point" };

async function typeAmount(page: Page, text: string) {
  for (const ch of text) {
    await page.getByRole("button", { name: KEY_NAMES[ch] ?? ch, exact: true }).click();
  }
}

async function seeded(page: Page) {
  await page.goto("/#/dev/seed");
  await expect(page.getByRole("heading", { name: "November" })).toBeVisible();
  await settle(page);
}

const sheet = (page: Page) => page.getByRole("dialog");
const bucketChip = (page: Page, name: string) =>
  sheet(page)
    .getByRole("group", { name: /Bucket|Money back into/ })
    .getByRole("button", { name: new RegExp(name) });
const tank = (page: Page) => page.getByRole("region", { name: "This month" });

async function openAdd(page: Page) {
  await page.getByRole("button", { name: "Add expense" }).click();
  await expect(sheet(page)).toBeVisible();
  await page.waitForTimeout(450);
}

async function shot(page: Page, name: string) {
  await page.screenshot({ path: `${DIR}/${name}.png` });
}

test("core loop: log an expense, see what's left, undo it (390)", async ({ page }) => {
  await seeded(page);
  await expect(tank(page)).toContainText("13,850");

  await openAdd(page);
  await shot(page, "quick-add-empty-390");
  await expect(sheet(page).getByRole("button", { name: "Save", exact: true })).toBeDisabled();

  await typeAmount(page, "250+180");
  await expect(sheet(page)).toContainText("250 + 180");
  await expect(sheet(page)).toContainText("430");
  // ✓ waits for a destination
  await expect(sheet(page).getByRole("button", { name: "Save", exact: true })).toBeDisabled();
  await bucketChip(page, "Food").click();
  await shot(page, "quick-add-ready-390");

  await sheet(page).getByRole("button", { name: "Save", exact: true }).click();
  await expect(page.getByRole("status", { name: "Saved" })).toBeVisible();
  await page.waitForTimeout(150);
  await shot(page, "quick-add-saved-390");
  await expect(sheet(page)).toBeHidden();
  await expect(page.getByText("₹430 logged to Food")).toBeVisible();
  await expect(tank(page)).toContainText("13,420");
  await page.waitForTimeout(700);
  await shot(page, "toast-logged-390");

  await page.getByRole("button", { name: "Undo" }).click();
  await expect(tank(page)).toContainText("13,850");
});

test("the 80% heads-up fires once (PRD §7.5 example 3)", async ({ page }) => {
  await seeded(page);
  // Food: ₹5,200 of ₹8,000 used. ₹1,200 more makes 80%.
  await openAdd(page);
  await typeAmount(page, "1200");
  await bucketChip(page, "Food").click();
  await sheet(page).getByRole("button", { name: "Save", exact: true }).click();
  await expect(page.getByText("80% of Food used.")).toBeVisible();
  await page.waitForTimeout(1000);
  await shot(page, "toast-heads-up-390");

  await openAdd(page);
  await typeAmount(page, "100");
  await bucketChip(page, "Food").click();
  await sheet(page).getByRole("button", { name: "Save", exact: true }).click();
  await expect(page.getByText("₹100 logged to Food")).toBeVisible();
  await expect(page.getByText("80% of Food used.")).toHaveCount(0);
});

test("money back, a back-dated entry, and note suggestions", async ({ page }) => {
  await seeded(page);

  // Note suggestions pick the usual bucket
  await openAdd(page);
  await typeAmount(page, "180");
  await sheet(page).getByPlaceholder("Add a note").fill("do");
  const suggestion = sheet(page).getByRole("button", { name: "Dosa and filter coffee" });
  await expect(suggestion).toBeVisible();
  await shot(page, "quick-add-suggestions-390");
  await suggestion.click();
  await expect(sheet(page).getByPlaceholder("Add a note")).toHaveValue("Dosa and filter coffee");
  await expect(bucketChip(page, "Food")).toHaveAttribute("aria-pressed", "true");

  // Back-date it to Monday 16 November
  await sheet(page)
    .getByRole("button", { name: /^Date: Today/ })
    .click();
  await page.waitForTimeout(300);
  await shot(page, "quick-add-day-picker-390");
  await expect(sheet(page).getByRole("radio", { name: "19 November" })).toBeDisabled();
  await sheet(page).getByRole("radio", { name: "16 November" }).click();
  await expect(sheet(page).getByRole("button", { name: /^Date: Mon 16 Nov/ })).toBeVisible();
  await sheet(page).getByRole("button", { name: "Save", exact: true }).click();
  await expect(sheet(page)).toBeHidden();

  // Money back
  await openAdd(page);
  await sheet(page).getByRole("radio", { name: "Money back" }).click();
  await typeAmount(page, "300");
  await bucketChip(page, "Leisure").click();
  await shot(page, "quick-add-money-back-390");
  await sheet(page).getByRole("button", { name: "Save", exact: true }).click();
  await expect(page.getByText("₹300 money back to Leisure")).toBeVisible();

  // Food detail shows the back-dated entry under its day
  await page
    .getByRole("region", { name: "Spend buckets" })
    .getByRole("button", { name: /Food/ })
    .click();
  const monday = page.getByRole("region", { name: "Mon 16 Nov" });
  await expect(monday).toContainText("Dosa and filter coffee");
  await expect(monday).toContainText("20:00");
});

test("edit an entry and delete one, each with Undo", async ({ page }) => {
  await seeded(page);
  await page.getByRole("button", { name: /Dinner with friends/ }).click();
  await expect(page.getByRole("dialog", { name: "Edit entry" })).toBeVisible();
  await page.waitForTimeout(450);
  await shot(page, "edit-entry-390");
  await typeAmount(page, "1500"); // types over the saved ₹1,250
  await sheet(page).getByRole("button", { name: "Save", exact: true }).click();
  await expect(page.getByText("Entry updated")).toBeVisible();
  await expect(page.getByRole("button", { name: /Dinner with friends/ })).toContainText("1,500");
  await page.getByRole("button", { name: "Undo" }).click();
  await expect(page.getByRole("button", { name: /Dinner with friends/ })).toContainText("1,250");

  await page.getByRole("button", { name: /Dinner with friends/ }).click();
  await sheet(page).getByRole("button", { name: "Delete entry" }).click();
  await shot(page, "delete-entry-390");
  await sheet(page).getByRole("button", { name: "Delete", exact: true }).click();
  await expect(page.getByText("Entry deleted")).toBeVisible();
  await expect(page.getByRole("button", { name: /Dinner with friends/ })).toHaveCount(0);
  await page.getByRole("button", { name: "Undo" }).click();
  await expect(page.getByRole("button", { name: /Dinner with friends/ })).toBeVisible();
});

test("favorites: offered after 3 times, then one tap from Home", async ({ page }) => {
  await seeded(page);
  // The sample month already has Metro ₹40 once today
  for (let i = 0; i < 2; i++) {
    await openAdd(page);
    await typeAmount(page, "40");
    await bucketChip(page, "Commute").click();
    await sheet(page).getByPlaceholder("Add a note").fill("Metro");
    await sheet(page).getByRole("button", { name: "Save", exact: true }).click();
    await expect(sheet(page)).toBeHidden();
  }
  const offer = page.getByText("Save “Metro · ₹40” as a favorite?");
  await expect(offer).toBeVisible({ timeout: 10_000 });
  await page.waitForTimeout(1200); // after the Undo toast has gone
  await shot(page, "toast-favorite-offer-390");
  await page.getByRole("status").getByRole("button", { name: "Save" }).click();

  const chip = page.getByRole("button", { name: "Log Metro, 40 rupees" });
  await expect(chip).toBeVisible();
  await settle(page);
  await shot(page, "home-quick-log-390");
  await chip.click();
  await expect(page.getByText("₹40 logged to Commute")).toBeVisible();

  // And it's the first row in Quick add
  await openAdd(page);
  await expect(sheet(page).getByRole("button", { name: "Log Metro, 40 rupees" })).toBeVisible();
  await shot(page, "quick-add-favorites-390");
});

test("long-press a vial to add to that bucket; + on a bucket's page too", async ({ page }) => {
  await seeded(page);
  const food = page
    .getByRole("region", { name: "Spend buckets" })
    .getByRole("button", { name: /Food/ });
  const box = await food.boundingBox();
  if (!box) throw new Error("no vial");
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await page.waitForTimeout(700);
  await page.mouse.up();
  await expect(sheet(page)).toBeVisible();
  await expect(bucketChip(page, "Food")).toHaveAttribute("aria-pressed", "true");
  expect(new URL(page.url()).hash).toBe("#/"); // opened Quick add instead of the bucket
  await page.keyboard.press("Escape");

  await page
    .getByRole("region", { name: "Spend buckets" })
    .getByRole("button", { name: /Commute/ })
    .click();
  await openAdd(page);
  await expect(bucketChip(page, "Commute")).toHaveAttribute("aria-pressed", "true");
});

test("activity list with bucket filters (390)", async ({ page }) => {
  await seeded(page);
  await page.getByRole("link", { name: "See all" }).click();
  await expect(page.getByRole("heading", { name: "Activity" })).toBeVisible();
  await settle(page);
  await shot(page, "activity-390");
  await page
    .getByRole("group", { name: "Filter by bucket" })
    .getByRole("button", { name: /Leisure/ })
    .click();
  await expect(page.getByText("Concert tickets")).toBeVisible();
  await expect(page.getByText("Dosa and filter coffee")).toHaveCount(0);
  await shot(page, "activity-filtered-390");
});

for (const width of WIDTHS.filter((w) => w !== 390)) {
  test(`Quick add at ${width}`, async ({ page }) => {
    await page.setViewportSize({ width, height: 844 });
    await seeded(page);
    await openAdd(page);
    await typeAmount(page, "250+180");
    await bucketChip(page, "Food").click();
    await page.screenshot({ path: `${DIR}/quick-add-ready-${width}.png` });
    await page.keyboard.press("Escape");
    await page.getByRole("link", { name: "See all" }).click();
    await settle(page);
    await page.screenshot({ path: `${DIR}/activity-${width}.png` });
  });
}

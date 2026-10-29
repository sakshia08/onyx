import { expect, test, type Page } from "@playwright/test";
import { settle, simulateIPhone, WIDTHS } from "./iphone";

const DIR = "screenshots/phase-6";

test.beforeEach(async ({ page }) => {
  await simulateIPhone(page);
  await page.clock.setFixedTime(new Date(2026, 10, 18, 20, 0));
});

async function seeded(page: Page) {
  await page.goto("/#/dev/seed");
  await expect(page.getByRole("heading", { name: "November" })).toBeVisible();
  await settle(page);
}

/** Moves the clock and lets the app notice, like returning to it later. */
async function timeTravel(page: Page, to: Date) {
  await page.clock.setFixedTime(to);
  await page.evaluate(() => {
    document.dispatchEvent(new Event("visibilitychange"));
  });
}

const shot = (page: Page, name: string) => page.screenshot({ path: `${DIR}/${name}.png` });
const tank = (page: Page) => page.getByRole("region", { name: "This month" });

test("Due now and Coming up on Home (PRD §8.3, §8.7)", async ({ page }) => {
  await seeded(page);
  const due = page.getByRole("region", { name: "Due now" });
  await expect(due).toContainText("Phone bill");
  await due.scrollIntoViewIfNeeded();
  await page.waitForTimeout(400);
  await shot(page, "home-due-now-390");
  const coming = page.getByRole("region", { name: "Coming up" });
  await expect(coming).toContainText("Netflix");
  await coming.evaluate((el) => {
    el.scrollIntoView({ block: "center" });
  });
  await page.waitForTimeout(400);
  await shot(page, "home-coming-up-390");

  await due.getByRole("button", { name: "Log" }).click();
  await expect(page.getByText("Phone bill ₹599 logged")).toBeVisible();
  await expect(page.getByRole("region", { name: "Due now" })).toHaveCount(0);
  await expect(tank(page)).toContainText("13,251");
});

test("'Log automatically' rules log on their day, once", async ({ page }) => {
  await seeded(page);
  await timeTravel(page, new Date(2026, 10, 28, 10, 0));
  await expect(page.getByText("Netflix ₹649 logged automatically")).toBeVisible();
  await expect(tank(page)).toContainText("13,201");
  await timeTravel(page, new Date(2026, 10, 28, 10, 5));
  await page.waitForTimeout(500);
  await expect(tank(page)).toContainText("13,201");
});

test("recurring list, and a new rule whose day has passed offers to log it", async ({ page }) => {
  await seeded(page);
  await page.getByRole("link", { name: "Settings" }).click();
  await page.getByRole("link", { name: /Recurring expenses/ }).click();
  await expect(page.getByRole("heading", { name: "Recurring" })).toBeVisible();
  await settle(page);
  await shot(page, "recurring-390");

  await page.getByRole("button", { name: "New" }).click();
  await page.getByLabel("Name").fill("Rent");
  await page.getByRole("button", { name: /^Amount/ }).click();
  for (const d of "15000")
    await page.getByRole("dialog").getByRole("button", { name: d, exact: true }).click();
  await page.getByRole("dialog").getByRole("button", { name: "Save", exact: true }).click();
  await page
    .getByRole("group", { name: "Bucket" })
    .getByRole("button", { name: /Saving/ })
    .click();
  await page.getByRole("radio", { name: "1", exact: true }).click();
  await page.waitForTimeout(300);
  await shot(page, "rule-editor-390");
  await page.getByRole("button", { name: "Add recurring expense" }).click();
  await expect(page.getByText("Rent's day has passed this month. Log ₹15,000 now?")).toBeVisible();
  await page.getByRole("status").getByRole("button", { name: "Log" }).click();
  await page.goto("/#/");
  await expect(tank(page)).toContainText("−");
});

test("a clock going backwards changes nothing (PRD §13)", async ({ page }) => {
  await seeded(page);
  await timeTravel(page, new Date(2026, 9, 20, 10, 0));
  await expect(
    page.getByText("Your iPhone's date is before November. Nothing was changed."),
  ).toBeVisible();
  await expect(page.getByRole("heading", { name: "November" })).toBeVisible();
});

test("month end: recap, leftover to piggy, then setup with hints (PRD §8.8)", async ({ page }) => {
  await seeded(page);
  await timeTravel(page, new Date(2026, 11, 1, 9, 0));
  await expect(page.getByRole("heading", { name: "November in review" })).toBeVisible();
  await page.waitForTimeout(900);
  await shot(page, "recap-1-review-390");

  const cards = ["buckets", "highlights", "compare", "piggies", "backup"];
  for (const card of cards) {
    await page.getByRole("button", { name: "Next" }).click();
    await page.waitForTimeout(700);
    await shot(page, `recap-${String(cards.indexOf(card) + 2)}-${card}-390`);
  }
  await page.getByRole("button", { name: "Plan December →" }).click();

  // Leftover: ₹13,850 left in November
  await expect(page.getByRole("heading", { name: /left in November/ })).toContainText("13,850");
  await settle(page);
  await shot(page, "leftover-390");
  await page.getByRole("button", { name: "Stash into Goa trip" }).click();
  const sheet = page.getByRole("dialog", { name: "Into Goa trip" });
  for (const d of "5000") await sheet.getByRole("button", { name: d, exact: true }).click();
  await sheet.getByRole("button", { name: "Save", exact: true }).click();
  await expect(page.getByText("₹5,000 moved to Goa trip")).toBeVisible();
  await expect(page.getByRole("heading", { name: /left in November/ })).toContainText("8,850");
  await page.getByRole("button", { name: "Skip" }).click();

  // Setup for December, with "Same as November" and the hints
  await expect(page.getByRole("heading", { name: "How much for December?" })).toBeVisible();
  await page.getByRole("button", { name: /Same as November/ }).click();
  await expect(page.getByRole("button", { name: /Use the average/ }).first()).toBeVisible();
  await expect(page.getByText("SIP ₹10,000 recurring")).toBeVisible();
  await settle(page);
  await shot(page, "setup-hints-390");
  await page.getByRole("button", { name: "Start December" }).click();

  await expect(page.getByRole("heading", { name: "December" })).toBeVisible();
  // A fresh month: November's leftover didn't roll over
  await expect(tank(page)).not.toContainText("13,850");
  await page.goto("/#/recap/2026-11");
  await expect(page.getByRole("heading", { name: "November in review" })).toBeVisible();
});

for (const width of WIDTHS.filter((w) => w !== 390)) {
  test(`recap at ${width}`, async ({ page }) => {
    await page.setViewportSize({ width, height: 844 });
    await seeded(page);
    await timeTravel(page, new Date(2026, 11, 1, 9, 0));
    await expect(page.getByRole("heading", { name: "November in review" })).toBeVisible();
    await page.waitForTimeout(900);
    await shot(page, `recap-1-review-${String(width)}`);
    await page.getByRole("button", { name: "Next" }).click();
    await page.waitForTimeout(700);
    await shot(page, `recap-2-buckets-${String(width)}`);
  });
}

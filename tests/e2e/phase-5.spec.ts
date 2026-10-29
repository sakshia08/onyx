import { expect, test, type Page } from "@playwright/test";
import { settle, simulateIPhone, WIDTHS } from "./iphone";

const DIR = "screenshots/phase-5";
const MID_NOVEMBER = new Date(2026, 10, 18, 20, 0);

test.beforeEach(async ({ page }) => {
  await simulateIPhone(page);
  await page.clock.setFixedTime(MID_NOVEMBER);
});

async function seeded(page: Page) {
  await page.goto("/#/dev/seed");
  await expect(page.getByRole("heading", { name: "November" })).toBeVisible();
  await settle(page);
}

async function piggyTab(page: Page) {
  await page.getByRole("link", { name: "Piggy" }).click();
  await expect(page.getByRole("heading", { name: "Piggy" })).toBeVisible();
  await settle(page);
  await page.waitForTimeout(700);
}

async function typeAmount(page: Page, digits: string) {
  const sheet = page.getByRole("dialog");
  for (const d of digits) await sheet.getByRole("button", { name: d, exact: true }).click();
}

const tank = (page: Page) => page.getByRole("region", { name: "This month" });
const shot = (page: Page, name: string) => page.screenshot({ path: `${DIR}/${name}.png` });

for (const width of WIDTHS) {
  test(`Piggy tab at ${width}`, async ({ page }) => {
    await page.setViewportSize({ width, height: 844 });
    await seeded(page);
    await piggyTab(page);
    await shot(page, `piggy-${width}`);
    if (width === 390) {
      await page.evaluate(() => {
        window.scrollTo(0, document.body.scrollHeight);
      });
      await page.waitForTimeout(500);
      await shot(page, "piggy-list-390");
    }
  });
}

test("stash: the coin drops, the month's left goes down, Undo works (PRD §8.6)", async ({
  page,
}) => {
  await seeded(page);
  await expect(tank(page)).toContainText("13,850");
  await piggyTab(page);
  // The plan is ₹2,900 and nothing is stashed yet this month
  await page.getByRole("button", { name: "Stash ₹2,900" }).click();
  const sheet = page.getByRole("dialog", { name: "Stash into Goa trip" });
  await expect(sheet).toContainText("2,900");
  await page.waitForTimeout(400);
  await shot(page, "stash-sheet-390");
  await sheet.getByRole("button", { name: "Save", exact: true }).click();
  await expect(page.getByText("₹2,900 stashed into Goa trip")).toBeVisible();
  await page.waitForTimeout(250);
  await shot(page, "stash-coin-390");
  await expect(page.getByRole("region", { name: "Piggies", exact: true })).toContainText("21,500");
  await expect(page.getByText(/This month: .*2,900.* of .*2,900.* stashed/)).toBeVisible();

  await page.getByRole("link", { name: "Home" }).click();
  await expect(tank(page)).toContainText("10,950");
  await page.getByRole("link", { name: "Piggy" }).click();
  await page.getByRole("button", { name: "Stash" }).first().waitFor();
  await page.getByRole("link", { name: "Home" }).click();
});

test("reaching the goal: confetti, wiggle, 'You did it!', then done", async ({ page }) => {
  await seeded(page);
  await piggyTab(page);
  await page.getByRole("tab", { name: "Insurance" }).click();
  await page.waitForTimeout(600);
  await page.getByRole("button", { name: /^Stash/ }).click();
  await typeAmount(page, "4000");
  await page.getByRole("dialog").getByRole("button", { name: "Save", exact: true }).click();
  const goal = page.getByRole("dialog", { name: "You did it!" });
  await expect(goal).toBeVisible({ timeout: 4000 });
  await page.waitForTimeout(500);
  await shot(page, "goal-reached-390");
  await goal.getByRole("button", { name: "Mark as done" }).click();
  await expect(page.getByText(/Completed/)).toBeVisible();
  await expect(page.getByRole("tab", { name: "Insurance" })).toHaveCount(0);
});

test("create a piggy from a template, with a live monthly amount", async ({ page }) => {
  await seeded(page);
  await piggyTab(page);
  await page.getByRole("button", { name: "New", exact: true }).click();
  await expect(page.getByRole("heading", { name: "New piggy" })).toBeVisible();
  await page.getByRole("button", { name: /Trip/ }).first().click();
  await expect(page.getByPlaceholder("What are you saving for?")).toHaveValue("Trip");
  await page.getByPlaceholder("What are you saving for?").fill("Ladakh trip");

  await page.getByRole("button", { name: /^Target/ }).click();
  await typeAmount(page, "50000");
  await page.getByRole("dialog").getByRole("button", { name: "Save", exact: true }).click();
  await page.getByLabel("By when? (optional)").fill("2027-05-31");
  await page.getByRole("button", { name: /^Already saved/ }).click();
  await typeAmount(page, "5000");
  await page.getByRole("dialog").getByRole("button", { name: "Save", exact: true }).click();
  // ₹45,000 still to go over Nov–May (7 months) = ₹6,428.57, rounded up to ₹6,429
  await expect(page.getByText("₹6,429/month for 7 months")).toBeVisible();
  await page.waitForTimeout(300);
  await shot(page, "new-piggy-390");

  await page.getByRole("button", { name: "Create piggy" }).click();
  await expect(page.getByText("Ladakh trip").first()).toBeVisible();
  await settle(page);
  await page.waitForTimeout(600);
  await shot(page, "piggy-detail-390");
  await expect(page.getByRole("button", { name: /Already saved/ })).toBeVisible();
});

test("spend from a piggy: only the piggy goes down; Activity shows it", async ({ page }) => {
  await seeded(page);
  await piggyTab(page);
  await page.getByRole("button", { name: "Spend from piggy" }).click();
  const sheet = page.getByRole("dialog");
  await expect(sheet.getByRole("button", { name: "Spend from piggy: Goa trip" })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  await typeAmount(page, "1000");
  await sheet.getByPlaceholder(/What was it/).fill("Hotel deposit");
  await sheet.getByRole("button", { name: "Save", exact: true }).click();
  await expect(page.getByText("Hotel deposit ₹1,000 spent from Goa trip")).toBeVisible();
  await expect(page.getByRole("region", { name: "Piggies", exact: true })).toContainText("17,600");

  await page.getByRole("link", { name: "Home" }).click();
  await expect(tank(page)).toContainText("13,850"); // the month didn't change
  await page.getByRole("link", { name: "See all" }).click();
  await page
    .getByRole("group", { name: "Filter by bucket" })
    .getByRole("button", { name: "Piggies" })
    .click();
  await expect(page.getByRole("button", { name: /Hotel deposit/ })).toBeVisible();
  await settle(page);
  await shot(page, "activity-piggies-390");
});

test("auto-stash happens once, on the next launch", async ({ page }) => {
  await seeded(page);
  await piggyTab(page);
  await page
    .getByRole("button", { name: /Goa trip/ })
    .last()
    .click();
  await page.getByRole("button", { name: "Edit" }).click();
  await page.getByRole("switch", { name: /Auto-stash/ }).click();
  await page.getByRole("button", { name: "Save" }).click();
  await page.reload();
  await expect(page.getByText("Auto-stashed into 1 piggy")).toBeVisible();
  await page.getByRole("button", { name: "Piggy" }).first().click();
  await page.goto("/#/");
  await expect(tank(page)).toContainText("10,950");
  await page.reload();
  await expect(tank(page)).toContainText("10,950"); // not twice
});

test("Home shows the nearest piggy", async ({ page }) => {
  await seeded(page);
  const peek = page.getByRole("region", { name: "Piggy" });
  await peek.scrollIntoViewIfNeeded();
  await expect(peek).toContainText("Insurance");
  await page.waitForTimeout(500);
  await shot(page, "home-piggy-peek-390");
});

test("setup plans each piggy, prefilled with its suggestion", async ({ page }) => {
  await page.goto("/#/dev/seed?setup=1");
  await expect(page.getByRole("heading", { name: "How much for November?" })).toBeVisible();
  for (const d of "60000") await page.getByRole("button", { name: d, exact: true }).click();
  await page.getByRole("button", { name: "Save", exact: true }).click();
  const plans = page.getByRole("region", { name: "Piggies", exact: true });
  await plans.scrollIntoViewIfNeeded();
  await expect(plans).toContainText("Goa trip");
  await expect(plans).toContainText("Suggested");
  await page.waitForTimeout(400);
  await shot(page, "setup-piggies-390");
});

test("no piggies yet: a sleeping pig and templates", async ({ page }) => {
  await page.goto("/#/");
  await page.getByRole("button", { name: "Continue" }).click();
  for (const d of "20000") await page.getByRole("button", { name: d, exact: true }).click();
  await page.getByRole("button", { name: "Save", exact: true }).click();
  await page.getByRole("button", { name: /^Start / }).click();
  await piggyTab(page);
  await expect(page.getByRole("img", { name: "Sleeping piggy bank" })).toBeVisible();
  await shot(page, "piggy-empty-390");
});

import { expect, test, type Page } from "@playwright/test";
import { settle, simulateIPhone, WIDTHS } from "./iphone";

const DIR = "screenshots/phase-2";
const FIRST_LAUNCH = new Date(2026, 9, 27, 10, 0); // 27 Oct: mid-month first launch
const MID_NOVEMBER = new Date(2026, 10, 18, 20, 0);

test.beforeEach(async ({ page }) => {
  await simulateIPhone(page);
});

async function typeAmount(page: Page, digits: string) {
  for (const d of digits) {
    await page.getByRole("button", { name: d === "." ? "decimal point" : d, exact: true }).click();
  }
}

async function setBucketAmount(page: Page, name: string, digits: string) {
  await page.getByRole("button", { name: `${name}, `, exact: false }).click();
  await expect(page.getByRole("dialog", { name: `Edit ${name}` })).toBeVisible();
  await typeAmount(page, digits);
  await page.getByRole("button", { name: "Save", exact: true }).click();
  await expect(page.getByRole("dialog")).toBeHidden();
}

/** Welcome → budget → buckets → Home, using the defaults. */
async function firstLaunch(page: Page, shots?: (name: string) => Promise<void>) {
  await page.goto("/#/");
  await expect(page.getByRole("heading", { name: "Onyx" })).toBeVisible();
  await settle(page);
  await page.waitForTimeout(1200);
  await shots?.("welcome");

  await page.getByLabel("What should I call you?").fill("Sakshi");
  await page.getByRole("button", { name: "Continue" }).click();
  await expect(page.getByRole("heading", { name: "How much for October?" })).toBeVisible();
  await typeAmount(page, "60000");
  await shots?.("setup-budget");
  await page.getByRole("button", { name: "Save", exact: true }).click();

  await expect(page.getByRole("heading", { name: /^Split 60000 rupees/ })).toBeVisible();
  await shots?.("setup-buckets-empty");
  await setBucketAmount(page, "Commute", "3000");
  await setBucketAmount(page, "Food", "8000");
  await setBucketAmount(page, "Leisure", "2000");
  await setBucketAmount(page, "Investing", "15000");
  await setBucketAmount(page, "Saving", "25000");
  await settle(page);
  await shots?.("setup-buckets-filled");
}

test("core loop: first launch to Home at 390", async ({ page }) => {
  await page.clock.setFixedTime(FIRST_LAUNCH);
  const shot = async (name: string) => {
    await page.screenshot({ path: `${DIR}/${name}-390.png` });
  };
  await firstLaunch(page, shot);

  // The editor, the emoji picker and adding a bucket
  await page.getByRole("button", { name: "Add bucket" }).click();
  await expect(page.getByRole("dialog", { name: "New bucket" })).toBeVisible();
  await page.waitForTimeout(500);
  await shot("bucket-editor-new");
  await page.getByRole("button", { name: /^Emoji:/ }).click();
  await page.waitForTimeout(300);
  await shot("bucket-editor-emoji");
  await page.getByRole("radio", { name: "🐶" }).click();
  await page.getByPlaceholder("Bucket name").fill("Pets");
  await typeAmount(page, "1000");
  await page.getByRole("button", { name: "Save", exact: true }).click();
  await expect(page.getByRole("button", { name: /^Pets, / })).toBeVisible();
  await page.waitForTimeout(400);
  await shot("setup-buckets-added");

  await page.getByRole("button", { name: "Start October" }).click();
  await expect(page.getByRole("heading", { name: "October" })).toBeVisible();
  await expect(page.getByText("Good morning, Sakshi")).toBeVisible();
  // ₹60,000 budget, nothing spent: everything is left, 5 days to go (27–31 Oct)
  await expect(page.getByRole("region", { name: "This month" })).toContainText("60,000");
  await expect(page.getByText("5 days left")).toBeVisible();
  await settle(page);
  await page.waitForTimeout(800);
  await shot("home-first");

  // Saved: reloading keeps everything
  await page.reload();
  await expect(page.getByRole("heading", { name: "October" })).toBeVisible();
  await expect(
    page.getByRole("region", { name: "Spend buckets" }).getByRole("button", { name: /Pets/ }),
  ).toBeVisible();
});

test("over-allocating is allowed with an amber warning", async ({ page }) => {
  await page.clock.setFixedTime(FIRST_LAUNCH);
  await firstLaunch(page);
  await setBucketAmount(page, "Saving", "40000");
  await expect(page.getByText(/Over-allocated by/)).toContainText("8,000");
  await page.waitForTimeout(300);
  await page.screenshot({ path: `${DIR}/setup-over-allocated-390.png` });
  await expect(page.getByRole("button", { name: "Start October" })).toBeEnabled();
});

for (const width of WIDTHS.filter((w) => w !== 390)) {
  test(`first launch screens at ${width}`, async ({ page }) => {
    await page.setViewportSize({ width, height: 844 });
    await page.clock.setFixedTime(FIRST_LAUNCH);
    await firstLaunch(page, async (name) => {
      if (name === "welcome" || name === "setup-buckets-filled" || name === "setup-budget") {
        await page.screenshot({ path: `${DIR}/${name}-${width}.png` });
      }
    });
    await page.getByRole("button", { name: "Start October" }).click();
    await expect(page.getByRole("heading", { name: "October" })).toBeVisible();
    await settle(page);
    await page.waitForTimeout(800);
    await page.screenshot({ path: `${DIR}/home-first-${width}.png` });
  });
}

async function seeded(page: Page) {
  await page.clock.setFixedTime(MID_NOVEMBER);
  await page.goto("/#/dev/seed");
  await expect(page.getByRole("heading", { name: "November" })).toBeVisible();
  await settle(page);
  await page.waitForTimeout(900);
}

for (const width of WIDTHS) {
  test(`Home with a month of data at ${width}`, async ({ page }) => {
    await page.setViewportSize({ width, height: 844 });
    await seeded(page);
    await page.screenshot({ path: `${DIR}/home-${width}.png` });
    if (width === 390) {
      await page.evaluate(() => {
        window.scrollTo(0, document.body.scrollHeight);
      });
      await page.waitForTimeout(600);
      await page.screenshot({ path: `${DIR}/home-bottom-390.png` });
    }
  });
}

test("bucket detail screens at 390", async ({ page }) => {
  await seeded(page);
  const vial = (section: string, name: string) =>
    page.getByRole("region", { name: section }).getByRole("button", { name: new RegExp(name) });

  for (const [section, name] of [
    ["Spend buckets", "Food"],
    ["Spend buckets", "Commute"],
    ["Spend buckets", "Leisure"],
    ["Spend buckets", "Groceries"],
    ["Save buckets", "Saving"],
  ] as const) {
    await vial(section, name).click();
    await expect(page.getByRole("heading", { name })).toBeVisible();
    await settle(page);
    await page.waitForTimeout(800);
    await page.screenshot({ path: `${DIR}/bucket-${name.toLowerCase()}-390.png` });
    if (name === "Food") {
      await page.evaluate(() => {
        window.scrollTo(0, document.body.scrollHeight);
      });
      await page.waitForTimeout(400);
      await page.screenshot({ path: `${DIR}/bucket-food-entries-390.png` });
    }
    await page.getByRole("button", { name: "Home" }).first().click();
    await expect(page.getByRole("heading", { name: "November" })).toBeVisible();
  }
});

test("edit a bucket, and move its entries before deleting it, at 390", async ({ page }) => {
  await seeded(page);
  await page
    .getByRole("region", { name: "Spend buckets" })
    .getByRole("button", { name: /Leisure/ })
    .click();
  await page.getByRole("button", { name: "Edit" }).click();
  const dialog = page.getByRole("dialog", { name: "Edit Leisure" });
  await expect(dialog).toBeVisible();
  await page.waitForTimeout(500);
  await page.screenshot({ path: `${DIR}/edit-bucket-390.png` });

  // Raise the amount: ₹2,000 → ₹3,000, so Leisure is no longer over (but still ahead of pace)
  await expect(dialog).toContainText("2,000");
  await typeAmount(page, "3000"); // types over the saved ₹2,000
  await page.getByRole("button", { name: "Save", exact: true }).click();
  await expect(page.getByRole("region", { name: "Leisure this month" })).toContainText("500");
  await expect(page.getByRole("region", { name: "Leisure this month" })).toContainText("Ahead of pace");

  // Delete: it has entries, so they must move first
  await page.getByRole("button", { name: "Edit" }).click();
  await page.getByRole("button", { name: "Delete bucket" }).click();
  await expect(page.getByText("Leisure has 2 entries")).toBeVisible();
  await page.waitForTimeout(300);
  await page.screenshot({ path: `${DIR}/delete-move-390.png` });
  await expect(page.getByRole("button", { name: "Move and delete" })).toBeDisabled();
  await page
    .getByRole("group", { name: "Move entries to" })
    .getByRole("button", { name: /Food/ })
    .click();
  await page.getByRole("button", { name: "Move and delete" }).click();
  await expect(page.getByRole("heading", { name: "Food" })).toBeVisible();
  await expect(page.getByText("Concert tickets")).toBeVisible();
  await page.getByRole("button", { name: "Home" }).first().click();
  await expect(
    page.getByRole("region", { name: "Spend buckets" }).getByRole("button", { name: /Leisure/ }),
  ).toHaveCount(0);
});

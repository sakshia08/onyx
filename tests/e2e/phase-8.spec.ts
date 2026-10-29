import { expect, test, type Page } from "@playwright/test";
import { settle, simulateIPhone, WIDTHS } from "./iphone";

const DIR = "screenshots/phase-8";

test.beforeEach(async ({ page }) => {
  await simulateIPhone(page);
  await page.clock.setFixedTime(new Date(2026, 10, 18, 20, 0));
  await page.goto("/#/dev/seed");
  await expect(page.getByRole("heading", { name: "November" })).toBeVisible();
  await settle(page);
});

const shot = (page: Page, name: string) => page.screenshot({ path: `${DIR}/${name}.png` });
const tank = (page: Page) => page.getByRole("region", { name: "This month" });

async function settings(page: Page) {
  await page.getByRole("link", { name: "Settings" }).click();
  await expect(page.getByRole("heading", { name: "Settings" })).toBeVisible();
}

async function enterPin(page: Page, pin: string) {
  for (const d of pin) await page.getByRole("button", { name: d, exact: true }).click();
}

for (const width of WIDTHS) {
  test(`Settings at ${width}`, async ({ page }) => {
    await page.setViewportSize({ width, height: 844 });
    await settings(page);
    await settle(page);
    await shot(page, `settings-${String(width)}`);
    if (width === 390) {
      await page.evaluate(() => {
        window.scrollTo(0, document.body.scrollHeight);
      });
      await page.waitForTimeout(400);
      await shot(page, "settings-bottom-390");
    }
  });
}

test("the eye hides every amount, on Home and Piggy (PRD §8.10)", async ({ page }) => {
  await page.getByRole("button", { name: "Hide amounts" }).click();
  await expect(tank(page)).toContainText("••••");
  await expect(tank(page)).not.toContainText("13,850");
  await page.waitForTimeout(400);
  await shot(page, "home-hidden-390");
  await page.getByRole("link", { name: "Piggy" }).click();
  await expect(page.getByRole("region", { name: "Piggies", exact: true })).not.toContainText(
    "18,600",
  );
  await page.getByRole("button", { name: "Show amounts" }).click();
  await expect(page.getByRole("region", { name: "Piggies", exact: true })).toContainText("18,600");
});

test("'Hide amounts when Onyx opens' starts hidden", async ({ page }) => {
  await settings(page);
  await page.getByRole("switch", { name: /Hide amounts when Onyx opens/ }).click();
  await page.goto("/#/");
  await page.reload();
  await expect(tank(page)).toContainText("••••");
});

test("PIN lock: set it, locked on launch, 5 wrong tries wait 30 seconds (PRD §8.10)", async ({
  page,
}) => {
  await settings(page);
  await page.getByRole("link", { name: /PIN lock/ }).click();
  await expect(page.getByRole("heading", { name: "Choose a 4-digit PIN" })).toBeVisible();
  await expect(page.getByText(/doesn't encrypt your data/)).toBeVisible();
  await enterPin(page, "2580");
  await expect(page.getByRole("heading", { name: "Enter it again" })).toBeVisible();
  await enterPin(page, "2580");
  await expect(page.getByText("PIN set")).toBeVisible({ timeout: 10_000 });

  await page.reload();
  await expect(page.getByRole("heading", { name: "Onyx is locked" })).toBeVisible();
  await settle(page);
  await shot(page, "lock-390");
  for (let i = 0; i < 5; i++) await enterPin(page, "1111");
  await expect(page.getByText(/Too many tries. Wait \d+ seconds./)).toBeVisible({
    timeout: 15_000,
  });
  await shot(page, "lock-cooldown-390");

  await page.clock.setFixedTime(new Date(2026, 10, 18, 20, 1));
  await expect(page.getByText("Enter your PIN")).toBeVisible({ timeout: 5000 });
  await enterPin(page, "2580");
  // Unlocked: back where we were
  await expect(page.getByRole("heading", { name: "Onyx is locked" })).toBeHidden({
    timeout: 10_000,
  });
  await expect(page.getByRole("heading", { name: "Settings" })).toBeVisible();
});

test("backup, erase, restore and undo restore give back exactly the same data (PRD §8.11 AC)", async ({
  page,
}) => {
  await settings(page);
  await page.getByRole("link", { name: /Backup and restore/ }).click();
  await expect(page.getByRole("heading", { name: "Backup and restore" })).toBeVisible();
  await settle(page);
  await shot(page, "backup-390");

  const [download] = await Promise.all([
    page.waitForEvent("download"),
    page.getByRole("button", { name: "Back up now" }).click(),
  ]);
  expect(download.suggestedFilename()).toBe("onyx-backup-2026-11-18.json");
  const file = await download.path();
  await expect(page.getByText("Backup saved")).toBeVisible();
  await expect(page.getByText("Last: 18 Nov")).toBeVisible();

  // Erase: only after typing ERASE
  await page.getByRole("link", { name: "Settings" }).click();
  await page.getByRole("button", { name: "Erase all data" }).click();
  const erase = page.getByRole("dialog", { name: "Erase all data" });
  await expect(erase.getByRole("button", { name: "Erase everything" })).toBeDisabled();
  await erase.getByLabel("Type ERASE to confirm").fill("ERASE");
  await page.waitForTimeout(300);
  await shot(page, "erase-390");
  await erase.getByRole("button", { name: "Erase everything" }).click();
  await expect(page.getByRole("heading", { name: "Onyx" })).toBeVisible();

  // Restore straight from Welcome
  await page.getByLabel("Backup file").setInputFiles(file);
  const preview = page.getByRole("dialog", { name: "Restore this backup?" });
  await expect(preview).toContainText("2 months · 16 entries · 3 piggies");
  await page.waitForTimeout(300);
  await shot(page, "restore-preview-390");
  await preview.getByRole("button", { name: "Replace everything on this phone" }).click();
  await expect(page.getByRole("heading", { name: "November" })).toBeVisible();
  await expect(tank(page)).toContainText("13,850");

  // Undo restore brings back exactly what was there before: the erased, empty app
  await settings(page);
  await page.getByRole("link", { name: /Backup and restore/ }).click();
  await page.getByRole("button", { name: "Undo restore" }).click();
  await expect(page.getByRole("heading", { name: "Onyx" })).toBeVisible();
});

test("a newer or damaged backup is refused, and nothing changes", async ({ page }) => {
  await settings(page);
  await page.getByRole("link", { name: /Backup and restore/ }).click();
  await page.getByLabel("Backup file").setInputFiles({
    name: "onyx-backup.json",
    mimeType: "application/json",
    buffer: Buffer.from(
      JSON.stringify({ app: "onyx", schemaVersion: 99, data: { schemaVersion: 99 } }),
    ),
  });
  await expect(page.getByText(/newer version of Onyx/)).toBeVisible();
  await page.getByLabel("Backup file").setInputFiles({
    name: "photo.json",
    mimeType: "application/json",
    buffer: Buffer.from("not json"),
  });
  await expect(page.getByText("That file isn't an Onyx backup.")).toBeVisible();
});

test("favorites: edit and delete with Undo (PRD §8.12)", async ({ page }) => {
  // Make a favorite the usual way: the sample has Metro ₹40 once; log it twice more
  for (let i = 0; i < 2; i++) {
    await page.getByRole("button", { name: "Add expense" }).click();
    const sheet = page.getByRole("dialog");
    for (const d of "40") await sheet.getByRole("button", { name: d, exact: true }).click();
    await sheet
      .getByRole("group", { name: "Bucket" })
      .getByRole("button", { name: /Commute/ })
      .click();
    await sheet.getByPlaceholder(/What was it/).fill("Metro");
    await sheet.getByRole("button", { name: "Save", exact: true }).click();
    await expect(sheet).toBeHidden();
  }
  await page.getByRole("status").getByRole("button", { name: "Save" }).click({ timeout: 12_000 });

  await settings(page);
  await page.getByRole("link", { name: /Favorites/ }).click();
  await page.getByRole("button", { name: /Metro/ }).click();
  const edit = page.getByRole("dialog", { name: "Edit Metro" });
  for (const d of "45") await edit.getByRole("button", { name: d, exact: true }).click();
  await edit.getByRole("button", { name: "Save", exact: true }).click();
  await expect(page.getByRole("button", { name: /Metro/ })).toContainText("45");
  await settle(page);
  await shot(page, "favorites-390");

  await page.getByRole("button", { name: /Metro/ }).click();
  await page.getByRole("button", { name: "Delete favorite" }).click();
  await expect(page.getByText("No favorites yet")).toBeVisible();
  await page.getByRole("button", { name: "Undo" }).click();
  await expect(page.getByRole("button", { name: /Metro/ })).toBeVisible();
});

test("Motion: Reduce switches the whole app to fades (PRD §8.12)", async ({ page }) => {
  await settings(page);
  await page.getByRole("radio", { name: "Reduce" }).click();
  await expect(page.locator("html")).toHaveAttribute("data-motion", "reduced");
  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("data-motion", "reduced");
});

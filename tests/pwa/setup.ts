import { expect, type Page } from "@playwright/test";

/** Welcome → ₹20,000 budget → Start, using the default buckets. */
export async function quickSetup(page: Page) {
  await page.goto("/");
  await page.getByRole("button", { name: "Continue" }).click();
  for (const d of "20000") await page.getByRole("button", { name: d, exact: true }).click();
  await page.getByRole("button", { name: "Save", exact: true }).click();
  await page.getByRole("button", { name: /^Start / }).click();
  await expect(page.getByRole("region", { name: "This month" })).toContainText("20,000");
}

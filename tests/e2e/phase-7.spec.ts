import { expect, test, type Page } from "@playwright/test";
import { settle, simulateIPhone, WIDTHS } from "./iphone";

const DIR = "screenshots/phase-7";

test.beforeEach(async ({ page }) => {
  await simulateIPhone(page);
  await page.clock.setFixedTime(new Date(2026, 10, 18, 20, 0));
  await page.goto("/#/dev/seed");
  await expect(page.getByRole("heading", { name: "November" })).toBeVisible();
});

async function insights(page: Page) {
  await page.getByRole("link", { name: "Insights" }).click();
  await expect(page.getByRole("heading", { name: "Insights" })).toBeVisible();
  await settle(page);
  await page.waitForTimeout(600);
}

const shot = (page: Page, name: string) => page.screenshot({ path: `${DIR}/${name}.png` });

for (const width of WIDTHS) {
  test(`Insights at ${width}`, async ({ page }) => {
    await page.setViewportSize({ width, height: 844 });
    await insights(page);
    await shot(page, `insights-${String(width)}`);
    if (width === 390) {
      await page.evaluate(() => {
        window.scrollTo(0, document.body.scrollHeight);
      });
      await page.waitForTimeout(400);
      await shot(page, "insights-bottom-390");
    }
  });
}

test("the chart: this week by default, tap a bar, switch to Month (PRD §8.9)", async ({ page }) => {
  await insights(page);
  const chart = page.getByRole("region", { name: "Spending" });
  await expect(chart).toContainText("16–22 Nov");
  // Today (Wed 18) is selected first; spend buckets only
  await expect(chart.getByRole("button", { name: /^Wed 18 Nov/ })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  await chart.getByRole("button", { name: /^Tue 17 Nov/ }).click();
  await expect(chart.getByRole("button", { name: /^Tue 17 Nov/ })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  await expect(chart).toContainText("1,899"); // Spotify ₹649 + dinner ₹1,250

  await chart.getByRole("button", { name: "Previous week" }).click();
  await expect(chart).toContainText("9–15 Nov");
  await chart.getByRole("radio", { name: "Month" }).click();
  await expect(chart.getByRole("button", { name: /Nov:/ })).toHaveCount(30);
  await chart.getByRole("button", { name: /^Thu 12 Nov/ }).click();
  await page.waitForTimeout(500);
  await chart.screenshot({ path: `${DIR}/chart-month-390.png` });
});

test("a past month: tiles, recap, leftover and read-only entries", async ({ page }) => {
  await insights(page);
  await page.getByRole("group", { name: "Month" }).getByRole("button", { name: "October" }).click();
  await expect(page.getByRole("region", { name: "Summary" })).toContainText("Closed");
  // A past month starts on its last real day: Saturday 31 October, not Sunday 1 November
  await expect(page.getByRole("button", { name: /^Sat 31 Oct/ })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  await settle(page);
  await shot(page, "insights-october-390");

  await page.getByRole("button", { name: "View recap" }).click();
  await expect(page.getByRole("heading", { name: "October in review" })).toBeVisible();
  await page.getByRole("button", { name: "Close recap" }).click();
  await expect(page.getByRole("heading", { name: "Insights" })).toBeVisible();

  // October: ₹65,000 budget, ₹40,000 of entries and ₹20,600 stashed, so ₹4,400 left
  await page.getByRole("group", { name: "Month" }).getByRole("button", { name: "October" }).click();
  await page.getByRole("button", { name: "Move leftover to a piggy" }).click();
  await expect(page.getByRole("heading", { name: /left in October/ })).toContainText("4,400");
  await page.getByRole("button", { name: "Stash into Goa trip" }).click();
  const sheet = page.getByRole("dialog", { name: "Into Goa trip" });
  for (const d of "1000") await sheet.getByRole("button", { name: d, exact: true }).click();
  await sheet.getByRole("button", { name: "Save", exact: true }).click();
  await expect(page.getByText("₹1,000 moved to Goa trip")).toBeVisible();
  await page.getByRole("button", { name: "Done" }).click();

  await page.getByRole("group", { name: "Month" }).getByRole("button", { name: "October" }).click();
  await page.getByRole("button", { name: "See all entries" }).click();
  await expect(page.getByRole("heading", { name: /October 2026/ })).toBeVisible();
  await expect(page.getByRole("main").getByText(/moved to Goa trip/)).toBeVisible();
  await settle(page);
  await shot(page, "month-detail-390");
  await page.getByRole("button", { name: /^Swiggy/ }).click();
  await expect(page.getByText("Past months are read-only.")).toBeVisible();
  await page.waitForTimeout(400);
  await shot(page, "entry-details-390");
});

test("search names across months, with filters (PRD §8.9)", async ({ page }) => {
  await insights(page);
  await page.getByRole("button", { name: "Search entries" }).click();
  await expect(page.getByRole("heading", { name: "Search" })).toBeVisible();
  await page.getByPlaceholder(/Starbucks/).fill("DOSA");
  // November ₹180.50 + October ₹3,200
  await expect(page.getByText(/2 entries/)).toContainText("3,380.50");
  await expect(page.getByRole("region", { name: "November 2026" })).toBeVisible();
  await expect(page.getByRole("region", { name: "October 2026" })).toBeVisible();
  await page.getByPlaceholder(/Starbucks/).blur();
  await settle(page);
  await shot(page, "search-390");

  await page.getByLabel("From").selectOption("2026-11");
  await expect(page.getByText(/1 entry/)).toBeVisible();
  await page.getByLabel("From").selectOption("");
  await page.getByPlaceholder(/Starbucks/).fill("");
  await page.getByRole("radio", { name: "Money back" }).click();
  await expect(page.getByText(/1 entry/)).toBeVisible();
  await expect(page.getByRole("button", { name: /Rahul paid me back/ })).toBeVisible();
  await page.getByRole("radio", { name: "All" }).click();
  await page
    .getByRole("group", { name: "Bucket" })
    .getByRole("button", { name: /Commute/ })
    .click();
  await expect(page.getByText(/3 entries/)).toBeVisible();
  // The Insights tab stays lit while searching
  await expect(page.getByRole("link", { name: "Insights" })).toHaveAttribute(
    "aria-current",
    "page",
  );
});

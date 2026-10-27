import { describe, expect, it } from "vitest";
import { rupees } from "./money";
import {
  averageUsed,
  canDeleteBucket,
  committedRecurring,
  defaultBuckets,
  deleteBucket,
  moveEntries,
  planFromPrevious,
  startMonth,
} from "./setup";
import { BUCKETS, entry, newId, november, rule } from "./testing";
import type { Month } from "./types";

const NOW = "2026-10-26T09:30:00";

describe("first launch (PRD §8.2)", () => {
  it("offers the five default buckets at ₹0", () => {
    const buckets = defaultBuckets(newId);
    expect(buckets.map((b) => [b.name, b.emoji, b.kind])).toEqual([
      ["Commute", "🚇", "spend"],
      ["Food", "🍜", "spend"],
      ["Leisure", "🎉", "spend"],
      ["Investing", "📈", "save"],
      ["Saving", "🏦", "save"],
    ]);
    expect(buckets.every((b) => b.allocated === 0)).toBe(true);
    expect(new Set(buckets.map((b) => b.id)).size).toBe(5);
  });

  it("PRD §13: first launch mid-month (26 Oct) sets up October as normal", () => {
    const result = startMonth(
      "2026-10",
      { totalBudget: rupees(20_000), buckets: BUCKETS, piggyPlans: [] },
      NOW,
    );
    expect(result.ok && result.month).toMatchObject({
      key: "2026-10",
      status: "active",
      totalBudget: rupees(20_000),
      entries: [],
      createdAt: NOW,
    });
  });
});

describe("starting a month", () => {
  it("can't start with zero buckets", () => {
    expect(
      startMonth("2026-11", { totalBudget: rupees(60_000), buckets: [], piggyPlans: [] }, NOW),
    ).toEqual({
      ok: false,
      reason: "no-buckets",
    });
  });

  it("allows over-allocating", () => {
    const result = startMonth(
      "2026-11",
      { totalBudget: rupees(1_000), buckets: BUCKETS, piggyPlans: [] },
      NOW,
    );
    expect(result.ok).toBe(true);
  });

  it("refuses negative amounts", () => {
    const broken = BUCKETS.map((b, i) => (i === 0 ? { ...b, allocated: -1 } : b));
    expect(
      startMonth("2026-11", { totalBudget: rupees(1_000), buckets: broken, piggyPlans: [] }, NOW),
    ).toEqual({
      ok: false,
      reason: "negative-amount",
    });
  });

  it("'Same as last month' keeps the budget, buckets and their ids", () => {
    const plan = planFromPrevious(november());
    expect(plan.totalBudget).toBe(rupees(60_000));
    expect(plan.buckets.map((b) => b.id)).toEqual(BUCKETS.map((b) => b.id));
    expect(plan.buckets.map((b) => b.allocated)).toEqual(BUCKETS.map((b) => b.allocated));
    const result = startMonth("2026-12", plan, NOW);
    expect(result.ok && result.month.buckets.map((b) => b.id)).toEqual(BUCKETS.map((b) => b.id));
  });
});

describe("'Avg ₹6,200' hint", () => {
  function closedMonth(key: string, foodUsed: number): Month {
    return { ...november({ entries: [entry("food", foodUsed)] }), key, status: "closed" };
  }

  it("averages the last 3 closed months that had the bucket, to the whole rupee", () => {
    const months = [
      closedMonth("2026-07", rupees(9_999)), // too old: only the last 3 count
      closedMonth("2026-08", rupees(6_000)),
      closedMonth("2026-09", rupees(6_100)),
      closedMonth("2026-10", rupees(6_500)),
    ];
    expect(averageUsed(months, "food", "2026-11")).toBe(rupees(6_200));
  });

  it("ignores the active month and months without the bucket", () => {
    const months = [
      closedMonth("2026-10", rupees(6_000)),
      november({ entries: [entry("food", rupees(1))] }),
    ];
    expect(averageUsed(months, "food", "2026-12")).toBe(rupees(6_000));
    expect(averageUsed(months, "pets", "2026-12")).toBeNull();
  });

  it("lists recurring amounts already committed to a bucket", () => {
    const rent = rule({ id: "rent", bucketId: "saving" });
    const off = rule({ id: "old", bucketId: "saving", active: false });
    expect(committedRecurring([rent, off, rule()], "saving")).toEqual([rent]);
  });
});

describe("PRD §13: deleting a bucket that has entries", () => {
  const month = november({ entries: [entry("leisure", rupees(500))] });

  it("isn't allowed until its entries are moved", () => {
    expect(canDeleteBucket(month, "leisure")).toBe(false);
    expect(deleteBucket(month, "leisure")).toBe(month);
  });

  it("works after moving them to another bucket", () => {
    const moved = moveEntries(month, "leisure", "food", NOW);
    expect(moved.entries[0]).toMatchObject({ bucketId: "food", updatedAt: NOW });
    const after = deleteBucket(moved, "leisure");
    expect(after.buckets.map((b) => b.id)).not.toContain("leisure");
  });

  it("past months are read-only", () => {
    const closed = { ...month, status: "closed" as const };
    expect(moveEntries(closed, "leisure", "food", NOW)).toBe(closed);
  });
});

import { describe, expect, it } from "vitest";
import {
  allBuckets,
  bucketTiles,
  defaultWeek,
  monthBars,
  monthsNewestFirst,
  savedThisMonth,
  searchEntries,
  spendOnDay,
  weekBars,
  weekLabel,
  weekStarts,
} from "./insights";
import { rupees } from "./money";
import { entry, goaTrip, november, txn } from "./testing";
import type { Month } from "./types";

const nov = november({
  entries: [
    entry("food", rupees(180), { date: "2026-11-16T13:00:00", note: "Dosa" }),
    entry("food", rupees(400), {
      date: "2026-11-16T09:00:00",
      type: "refund",
      note: "Rahul paid me back",
    }),
    entry("commute", rupees(40), { date: "2026-11-16T09:10:00", note: "Metro" }),
    entry("saving", rupees(25_000), { date: "2026-11-16T10:00:00", note: "FD" }),
    entry("food", rupees(1_250), { date: "2026-11-30T20:00:00", note: "Dinner" }),
  ],
});
const oct: Month = {
  ...november({
    entries: [entry("food", rupees(1_000), { date: "2026-10-10T12:00:00", note: "Dosa" })],
  }),
  key: "2026-10",
  status: "closed",
};
const months = { "2026-10": oct, "2026-11": nov };

describe("the bar chart (PRD §8.9: spend buckets only)", () => {
  it("a day's bar is expenses minus money back, without save buckets", () => {
    expect(spendOnDay(nov, 16)).toBe(rupees(180 - 400 + 40));
    expect(spendOnDay(nov, 17)).toBe(0);
  });

  it("Month view has a bar per day", () => {
    const bars = monthBars(nov);
    expect(bars).toHaveLength(30);
    expect(bars[29]).toMatchObject({
      day: 30,
      label: "30",
      name: "Mon 30 Nov",
      value: rupees(1_250),
    });
  });

  it("Week view runs Monday to Sunday; days outside the month are empty (decision c)", () => {
    // 1 Nov 2026 is a Sunday, so the first week starts on Monday 26 Oct (day −5)
    expect(weekStarts("2026-11")).toEqual([-5, 2, 9, 16, 23, 30]);
    const first = weekBars(nov, -5);
    expect(first.map((b) => b.day)).toEqual([null, null, null, null, null, null, 1]);
    expect(weekBars(nov, 16).map((b) => b.label)).toEqual(["M", "T", "W", "T", "F", "S", "S"]);
    expect(weekBars(nov, 16)[0]?.value).toBe(rupees(180 - 400 + 40));
    expect(weekLabel("2026-11", 16)).toBe("16–22 Nov");
    expect(weekLabel("2026-11", 30)).toBe("30–30 Nov");
  });

  it("defaults to the current week, or the last week of a past month", () => {
    expect(defaultWeek("2026-11", 18)).toBe(16);
    expect(defaultWeek("2026-11", 1)).toBe(-5);
    expect(defaultWeek("2026-11", null)).toBe(30);
  });
});

describe("tiles, savings and the month switcher", () => {
  it("bucket tiles show used and the change vs last month", () => {
    const food = bucketTiles(nov, months).find((t) => t.bucket.id === "food");
    expect(food).toMatchObject({ used: rupees(180 - 400 + 1_250), change: 3 });
    expect(bucketTiles(oct, months)[0]?.change).toBeNull(); // nothing before October
  });

  it("saved this month = save buckets + piggy stashes", () => {
    const piggy = goaTrip({ transactions: [txn("stash", rupees(6_000), "2026-11-05T10:00:00")] });
    expect(savedThisMonth(nov, [piggy])).toEqual({
      buckets: rupees(25_000),
      piggies: rupees(6_000),
      total: rupees(31_000),
    });
  });

  it("lists months newest first", () => {
    expect(monthsNewestFirst(months).map((m) => m.key)).toEqual(["2026-11", "2026-10"]);
  });
});

describe("search (PRD §8.9)", () => {
  it("matches any part of a note, any capitals, across months, grouped by month", () => {
    const r = searchEntries(months, { query: "DOS" });
    expect(r.count).toBe(2);
    expect(r.total).toBe(rupees(1_180));
    expect(r.months.map((m) => [m.month.key, m.total])).toEqual([
      ["2026-11", rupees(180)],
      ["2026-10", rupees(1_000)],
    ]);
  });

  it("filters by bucket, month range and type", () => {
    expect(searchEntries(months, { query: "", bucketId: "commute" }).count).toBe(1);
    expect(searchEntries(months, { query: "dosa", from: "2026-11", to: "2026-11" }).count).toBe(1);
    const refunds = searchEntries(months, { query: "", type: "refund" });
    expect(refunds.count).toBe(1);
    expect(refunds.total).toBe(-rupees(400));
  });

  it("finds nothing for a note nobody wrote", () => {
    expect(searchEntries(months, { query: "zzz" })).toEqual({ count: 0, total: 0, months: [] });
  });

  it("offers every bucket ever used, once each", () => {
    expect(allBuckets(months).map((b) => b.id)).toEqual([
      "commute",
      "food",
      "leisure",
      "investing",
      "saving",
    ]);
  });
});

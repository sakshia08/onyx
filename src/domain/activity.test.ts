import { describe, expect, it } from "vitest";
import { dayLabel, entryTime, groupEntriesByDay, newestFirst, recentEntries } from "./activity";
import { rupees } from "./money";
import { entry } from "./testing";

describe("entries grouped by day (PRD §8.5)", () => {
  const entries = [
    entry("food", rupees(180), { date: "2026-11-18T13:42:00", note: "Dosa" }),
    entry("food", rupees(400), { date: "2026-11-18T08:55:00", type: "refund" }),
    entry("food", rupees(250), { date: "2026-11-17T20:10:00" }),
    entry("food", rupees(90), { date: "2026-11-16T09:00:00" }),
    entry("food", rupees(60), { date: "2026-11-18T19:30:00" }),
  ];

  it("labels days Today, Yesterday, then 'Mon 16 Nov'", () => {
    expect(dayLabel("2026-11-18", "2026-11-18")).toBe("Today");
    expect(dayLabel("2026-11-17", "2026-11-18")).toBe("Yesterday");
    expect(dayLabel("2026-11-16", "2026-11-18")).toBe("Mon 16 Nov");
  });

  it("groups newest first, with each day's total (money back subtracts)", () => {
    const groups = groupEntriesByDay(entries, "2026-11-18");
    expect(groups.map((g) => [g.label, g.total])).toEqual([
      ["Today", rupees(60 + 180 - 400)],
      ["Yesterday", rupees(250)],
      ["Mon 16 Nov", rupees(90)],
    ]);
    expect(groups[0]?.entries.map(entryTime)).toEqual(["19:30", "13:42", "08:55"]);
  });

  it("an empty list has no groups", () => {
    expect(groupEntriesByDay([], "2026-11-18")).toEqual([]);
  });

  it("entries at the same time sort by when they were logged", () => {
    const a = entry("food", 100, { date: "2026-11-18T09:00:00", createdAt: "2026-11-18T09:00:01" });
    const b = entry("food", 100, { date: "2026-11-18T09:00:00", createdAt: "2026-11-18T09:05:00" });
    expect(newestFirst([a, b])).toEqual([b, a]);
  });

  it("Recent shows the last 5", () => {
    const many = Array.from({ length: 8 }, (_, i) =>
      entry("food", 100, { date: `2026-11-1${String(i)}T09:00:00` }),
    );
    expect(recentEntries(many).map((e) => e.date.slice(8, 10))).toEqual([
      "17",
      "16",
      "15",
      "14",
      "13",
    ]);
  });
});

import { describe, expect, it } from "vitest";
import { bucketUsed } from "./budget";
import {
  addEntry,
  dateForDay,
  removeEntry,
  replaceEntry,
  restoreEntry,
  selectableDays,
} from "./entries";
import { rupees } from "./money";
import { entry, november } from "./testing";

const NOW = "2026-11-18T20:00:00";

describe("logging an entry (PRD §8.4)", () => {
  it("adds it to its bucket", () => {
    const { month } = addEntry(november(), entry("food", rupees(430)));
    expect(bucketUsed(month.entries, "food")).toBe(rupees(430));
  });

  it("fires the 80% heads-up once, then the 100% one once (PRD §7.5 example 3)", () => {
    let m = november({ entries: [entry("food", rupees(6_000))] });
    const first = addEntry(m, entry("food", rupees(500)));
    expect(first.headsUp).toEqual({ bucketId: "food", threshold: 80 });
    m = first.month;
    const again = addEntry(m, entry("food", rupees(100)));
    expect(again.headsUp).toBeNull();
    const full = addEntry(again.month, entry("food", rupees(1_400)));
    expect(full.headsUp).toEqual({ bucketId: "food", threshold: 100 });
    expect(full.month.alertsShown).toEqual([
      { bucketId: "food", threshold: 80 },
      { bucketId: "food", threshold: 100 },
    ]);
  });

  it("money back never fires a heads-up, and save buckets never do", () => {
    expect(
      addEntry(november(), entry("food", rupees(9_000), { type: "refund" })).headsUp,
    ).toBeNull();
    expect(addEntry(november(), entry("investing", rupees(20_000))).headsUp).toBeNull();
  });

  it("past months are read-only", () => {
    const closed = november({ status: "closed" });
    expect(addEntry(closed, entry("food", 100)).month).toBe(closed);
  });

  it("refuses a date outside the month or an unknown bucket", () => {
    const m = november();
    expect(addEntry(m, entry("food", 100, { date: "2026-12-01T00:00:00" })).month).toBe(m);
    expect(addEntry(m, entry("pets", 100)).month).toBe(m);
  });

  it("logging the same entry twice (a double tap) adds it once", () => {
    const e = entry("food", 100);
    const once = addEntry(november(), e).month;
    expect(addEntry(once, e).month).toBe(once);
  });
});

describe("editing and deleting (PRD §8.5)", () => {
  const original = entry("food", rupees(250), { note: "Lunch" });
  const month = november({ entries: [original] });

  it("edits keep the id and set updatedAt; moving buckets moves the money", () => {
    const { month: edited } = replaceEntry(
      month,
      { ...original, bucketId: "leisure", amount: rupees(300) },
      NOW,
    );
    expect(edited.entries).toEqual([
      { ...original, bucketId: "leisure", amount: rupees(300), updatedAt: NOW },
    ]);
    expect(bucketUsed(edited.entries, "food")).toBe(0);
    expect(bucketUsed(edited.entries, "leisure")).toBe(rupees(300));
  });

  it("an edit can trigger a heads-up", () => {
    const big = replaceEntry(month, { ...original, amount: rupees(7_000) }, NOW);
    expect(big.headsUp).toEqual({ bucketId: "food", threshold: 80 });
  });

  it("delete returns the entry, and Undo puts it back exactly", () => {
    const { month: without, removed } = removeEntry(month, original.id);
    expect(without.entries).toEqual([]);
    expect(removed).toEqual(original);
    expect(restoreEntry(without, original).entries).toEqual([original]);
  });

  it("Undo after an edit brings back the original", () => {
    const { month: edited } = replaceEntry(month, { ...original, amount: rupees(999) }, NOW);
    expect(restoreEntry(edited, original).entries).toEqual([original]);
  });

  it("Undo after logging removes the new entry", () => {
    const e = entry("food", 100);
    const { month: logged } = addEntry(month, e);
    expect(removeEntry(logged, e.id).month.entries).toEqual([original]);
  });

  it("closed months can't be edited or deleted from", () => {
    const closed = { ...month, status: "closed" as const };
    expect(replaceEntry(closed, { ...original, amount: 1 }, NOW).month).toBe(closed);
    expect(removeEntry(closed, original.id).month).toBe(closed);
  });
});

describe("the date picker (PRD §8.4)", () => {
  it("offers the 1st of this month through today", () => {
    expect(selectableDays("2026-11", new Date(2026, 10, 18))).toEqual(
      Array.from({ length: 18 }, (_, i) => i + 1),
    );
    expect(selectableDays("2026-11", new Date(2026, 10, 1))).toEqual([1]);
  });

  it("a back-dated new entry keeps the current time (decision b)", () => {
    expect(dateForDay("2026-11", 16, new Date(2026, 10, 18, 20, 5, 9))).toBe("2026-11-16T20:05:09");
  });

  it("an edited entry keeps its own time", () => {
    expect(dateForDay("2026-11", 3, "2026-11-12T13:42:07")).toBe("2026-11-03T13:42:07");
  });
});

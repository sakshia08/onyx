import { describe, expect, it } from "vitest";
import { bucketUsed } from "./budget";
import { rupees } from "./money";
import { BUCKETS, entry, goaTrip, NOV, november, txn } from "./testing";
import { allocatedTotal, monthRemaining, monthUsed, stashedThisMonth, unallocated } from "./totals";

describe("PRD §7.5 setup", () => {
  it("allocatedTotal is ₹59,000 and unallocated is ₹1,000", () => {
    const month = november();
    expect(allocatedTotal(month)).toBe(rupees(59_000));
    expect(unallocated(month)).toBe(rupees(1_000));
  });
});

describe("PRD §7.5 example 10: totals with a stash", () => {
  it("stashing ₹6,000 into Goa trip raises November's used by ₹6,000 and leaves buckets alone", () => {
    const month = november({ entries: [entry("food", rupees(5_200))] });
    const before = goaTrip();
    const after = goaTrip({ transactions: [txn("stash", rupees(6_000), "2026-11-05T10:00:00")] });

    expect(monthUsed(month, [after]) - monthUsed(month, [before])).toBe(rupees(6_000));
    expect(stashedThisMonth([after], NOV)).toBe(rupees(6_000));
    for (const b of BUCKETS)
      expect(bucketUsed(month.entries, b.id)).toBe(b.id === "food" ? rupees(5_200) : 0);
    expect(monthRemaining(month, [after])).toBe(rupees(60_000 - 5_200 - 6_000));
  });

  it("spending from a piggy never touches the month (PRD §7.4)", () => {
    const month = november();
    const piggy = goaTrip({
      transactions: [
        txn("stash", rupees(6_000), "2026-11-05T10:00:00"),
        txn("spend", rupees(2_000), "2026-11-20T10:00:00"),
      ],
    });
    expect(monthUsed(month, [piggy])).toBe(rupees(6_000));
  });

  it("leftover moves into a piggy aren't this month's stashes", () => {
    const piggy = goaTrip({
      transactions: [txn("leftover", rupees(1_800), "2026-11-01T09:00:00", "2026-10")],
    });
    expect(stashedThisMonth([piggy], NOV)).toBe(0);
  });
});

describe("PRD §13: buckets adding up to more than the total", () => {
  it("is allowed and shows as negative unallocated (the amber warning)", () => {
    const month = november({ totalBudget: rupees(50_000) });
    expect(unallocated(month)).toBe(-rupees(9_000));
  });
});

describe("month remaining", () => {
  it("money back adds to what's left; overspending can make it negative", () => {
    const month = november({
      totalBudget: rupees(1_000),
      entries: [entry("food", rupees(1_500)), entry("food", rupees(200), { type: "refund" })],
    });
    expect(monthRemaining(month, [])).toBe(-rupees(300));
  });
});

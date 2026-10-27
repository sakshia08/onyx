import { describe, expect, it } from "vitest";
import { rupees } from "./money";
import {
  balanceAtStartOfMonth,
  currentCycle,
  expectedAtStartOfMonth,
  monthsLeft,
  piggyBalance,
  piggyProgress,
  piggyStatus,
  piggyToGo,
  plannedThisMonth,
  stashedIntoThisMonth,
  suggestedThisMonth,
  toStashThisMonth,
} from "./piggy";
import { goaTrip, NOV, november, txn } from "./testing";
import { monthRemaining } from "./totals";

describe("PRD §7.5 worked examples: piggies", () => {
  it("6. Piggy suggestion: 5 months left (Nov–Mar), so ₹6,000 this month", () => {
    const goa = goaTrip();
    expect(monthsLeft(NOV, "2027-03-15")).toBe(5);
    expect(suggestedThisMonth(goa, "2026-11-01")).toBe(rupees(6_000));
  });

  describe("7. Falling behind: only ₹4,000 stashed in November", () => {
    const goa = goaTrip({ transactions: [txn("stash", rupees(4_000), "2026-11-10T20:00:00")] });

    it("on 1 Dec the suggestion becomes (30,000 − 4,000) / 4 = ₹6,500", () => {
      expect(monthsLeft("2026-12", "2027-03-15")).toBe(4);
      expect(suggestedThisMonth(goa, "2026-12-01")).toBe(rupees(6_500));
    });

    it("expected is 30,000 × 1/5 = ₹6,000, so it's Behind by ₹2,000", () => {
      expect(expectedAtStartOfMonth(goa, "2026-12-01")).toBe(rupees(6_000));
      expect(piggyStatus(goa, "2026-12-01")).toEqual({ kind: "behind", by: rupees(2_000) });
    });
  });

  describe("12. Savings carry across months", () => {
    const october = { ...november(), key: "2026-10", status: "closed" as const, piggyPlans: [] };
    const nov = november({ piggyPlans: [] });
    const octoberOnly = goaTrip({
      createdAt: "2026-10-01T09:00:00",
      transactions: [txn("stash", rupees(4_000), "2026-10-12T20:00:00")],
    });

    it("in November it shows ₹4,000 saved and ₹26,000 to go", () => {
      expect(piggyBalance(octoberOnly)).toBe(rupees(4_000));
      expect(piggyToGo(octoberOnly)).toBe(rupees(26_000));
      expect(balanceAtStartOfMonth(octoberOnly, NOV)).toBe(rupees(4_000));
    });

    it("after ₹6,500 more in November: ₹10,500 saved and ₹19,500 to go", () => {
      const both = {
        ...octoberOnly,
        transactions: [
          ...octoberOnly.transactions,
          txn("stash", rupees(6_500), "2026-11-03T20:00:00"),
        ],
      };
      expect(piggyBalance(both)).toBe(rupees(10_500));
      expect(piggyToGo(both)).toBe(rupees(19_500));

      // Each month's own remaining ends with that month
      expect(monthRemaining(october, [both])).toBe(rupees(60_000 - 4_000));
      expect(monthRemaining(nov, [both])).toBe(rupees(60_000 - 6_500));
    });
  });

  it("13. Plan vs suggestion: plan ₹4,000, ₹1,000 stashed, so ₹3,000 to stash", () => {
    const goa = goaTrip({ transactions: [txn("stash", rupees(1_000), "2026-11-04T20:00:00")] });
    const month = november({ piggyPlans: [{ piggyId: "goa", planned: rupees(4_000) }] });
    expect(suggestedThisMonth(goa, "2026-11-05")).toBe(rupees(6_000));
    expect(plannedThisMonth(goa, month, "2026-11-05")).toBe(rupees(4_000));
    expect(stashedIntoThisMonth(goa, NOV)).toBe(rupees(1_000));
    expect(toStashThisMonth(goa, month, "2026-11-05")).toBe(rupees(3_000));
  });
});

describe("suggestions (PRD §7.4)", () => {
  it("don't shift as I stash mid-month", () => {
    const goa = goaTrip({ transactions: [txn("stash", rupees(3_000), "2026-11-15T20:00:00")] });
    expect(suggestedThisMonth(goa, "2026-11-20")).toBe(rupees(6_000));
    expect(toStashThisMonth(goa, november({ piggyPlans: [] }), "2026-11-20")).toBe(rupees(3_000));
  });

  it("round up to the whole rupee", () => {
    const piggy = goaTrip({ target: rupees(10_000), targetDate: "2027-01-31" });
    expect(suggestedThisMonth(piggy, "2026-11-01")).toBe(rupees(3_334));
  });

  it("use the suggestion when the piggy has no plan this month (e.g. created after setup)", () => {
    expect(plannedThisMonth(goaTrip(), november({ piggyPlans: [] }), "2026-11-20")).toBe(
      rupees(6_000),
    );
  });

  it("never go below zero, and toStash never goes negative after stashing extra", () => {
    const goa = goaTrip({ transactions: [txn("stash", rupees(9_000), "2026-11-05T20:00:00")] });
    expect(toStashThisMonth(goa, november(), "2026-11-06")).toBe(0);
    const full = goaTrip({ transactions: [txn("opening", rupees(31_000), "2026-11-01T09:00:00")] });
    expect(suggestedThisMonth(full, "2026-11-02")).toBe(0);
  });

  it("count an opening balance as start-of-month money", () => {
    const piggy = goaTrip({
      createdAt: "2026-11-10T09:00:00",
      transactions: [txn("opening", rupees(6_000), "2026-11-10T09:00:00")],
    });
    expect(balanceAtStartOfMonth(piggy, NOV)).toBe(rupees(6_000));
    expect(suggestedThisMonth(piggy, "2026-11-10")).toBe(rupees(4_800));
  });

  it("count leftover moved in this month as start-of-month money (PRD §17 answer 6)", () => {
    const piggy = goaTrip({
      transactions: [txn("leftover", rupees(1_800), "2026-11-01T10:00:00", "2026-10")],
    });
    expect(balanceAtStartOfMonth(piggy, NOV)).toBe(rupees(1_800));
    expect(stashedIntoThisMonth(piggy, NOV)).toBe(0);
  });
});

describe("status", () => {
  it("is On track when the start-of-month balance meets the expected amount", () => {
    const goa = goaTrip({ transactions: [txn("stash", rupees(6_000), "2026-11-10T20:00:00")] });
    expect(piggyStatus(goa, "2026-12-01")).toEqual({ kind: "on-track" });
  });

  it("is Done once the balance reaches the target", () => {
    const goa = goaTrip({ transactions: [txn("stash", rupees(30_000), "2026-11-10T20:00:00")] });
    expect(piggyStatus(goa, "2026-11-11")).toEqual({ kind: "done" });
    expect(piggyProgress(goa)).toBe(1);
  });
});

describe("PRD §13 piggy edge cases", () => {
  it("no target date: no suggestion, progress only", () => {
    const piggy = goaTrip();
    delete piggy.targetDate;
    expect(suggestedThisMonth(piggy, "2026-11-05")).toBeNull();
    expect(expectedAtStartOfMonth(piggy, "2026-11-05")).toBeNull();
    expect(piggyStatus(piggy, "2026-11-05")).toEqual({ kind: "no-date" });
    expect(plannedThisMonth(piggy, november({ piggyPlans: [] }), "2026-11-05")).toBe(0);
  });

  it("one-time piggy past its target date: Date passed (not on the day itself)", () => {
    expect(piggyStatus(goaTrip(), "2027-03-15").kind).not.toBe("date-passed");
    expect(piggyStatus(goaTrip(), "2027-03-16")).toEqual({ kind: "date-passed" });
  });

  it("spent below zero: the balance goes negative, progress stays at 0", () => {
    const piggy = goaTrip({
      transactions: [
        txn("opening", rupees(1_000), "2026-11-01T09:00:00"),
        txn("spend", rupees(3_000), "2026-11-12T09:00:00"),
      ],
    });
    expect(piggyBalance(piggy)).toBe(-rupees(2_000));
    expect(piggyProgress(piggy)).toBe(0);
  });
});

describe("yearly piggies (PRD §7.4)", () => {
  const insurance = goaTrip({
    id: "insurance",
    name: "Insurance",
    target: rupees(12_000),
    repeat: "yearly",
    transactions: [
      txn("stash", rupees(12_000), "2027-01-10T09:00:00"),
      txn("spend", rupees(12_000), "2027-02-20T09:00:00"),
    ],
  });

  it("stays in the first cycle up to and including the target date", () => {
    expect(currentCycle(insurance, "2027-03-15")).toEqual({
      startMonth: NOV,
      targetDate: "2027-03-15",
    });
  });

  it("starts the next cycle the day after the target date, due a year later", () => {
    expect(currentCycle(insurance, "2027-03-16")).toEqual({
      startMonth: "2027-03",
      targetDate: "2028-03-15",
    });
  });

  it("counts the new cycle's maths from its own start, with the balance carried over", () => {
    expect(piggyStatus(insurance, "2027-03-16").kind).not.toBe("date-passed");
    expect(expectedAtStartOfMonth(insurance, "2027-03-16")).toBe(0);
    // 13 months (Mar 2027 – Mar 2028): ₹12,000 / 13 = ₹923.08, rounded up to ₹924
    expect(monthsLeft("2027-03", "2028-03-15")).toBe(13);
    expect(suggestedThisMonth(insurance, "2027-03-16")).toBe(rupees(924));
  });

  it("skips ahead several cycles if the app wasn't opened for years", () => {
    expect(currentCycle(insurance, "2029-06-01")?.targetDate).toBe("2030-03-15");
  });

  it("a 29 February target lands on 28 February in non-leap years", () => {
    const leap = goaTrip({
      repeat: "yearly",
      targetDate: "2028-02-29",
      createdAt: "2027-06-01T09:00:00",
    });
    expect(currentCycle(leap, "2028-03-01")?.targetDate).toBe("2029-02-28");
  });
});

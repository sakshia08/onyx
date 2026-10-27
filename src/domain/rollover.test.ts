import { describe, expect, it } from "vitest";
import { rupees } from "./money";
import { canOfferLeftover, checkMonth, closeMonth, leftoverMoved, maxLeftover } from "./rollover";
import { entry, goaTrip, NOV, november, txn } from "./testing";

describe("checking the month (PRD §8.8)", () => {
  it("does nothing while still in the active month", () => {
    expect(checkMonth(NOV, new Date(2026, 10, 30, 23, 59, 59))).toEqual({ kind: "same" });
  });

  it("rolls over at midnight on the 1st", () => {
    expect(checkMonth(NOV, new Date(2026, 11, 1, 0, 0, 0))).toEqual({
      kind: "rollover",
      closing: NOV,
      current: "2026-12",
    });
  });

  it("PRD §13: after months away, closes the last active month and skips the empty ones", () => {
    expect(checkMonth(NOV, new Date(2027, 3, 9))).toEqual({
      kind: "rollover",
      closing: NOV,
      current: "2027-04",
    });
  });

  it("PRD §13: a clock going backwards never closes anything", () => {
    expect(checkMonth(NOV, new Date(2026, 9, 31))).toEqual({
      kind: "clock-back",
      active: NOV,
      current: "2026-10",
    });
  });

  it("asks for setup when no month exists yet (first launch)", () => {
    expect(checkMonth(null, new Date(2026, 9, 26))).toEqual({ kind: "no-month" });
  });
});

describe("closing a month", () => {
  it("makes it read-only with closedAt, and is safe to repeat", () => {
    const closed = closeMonth(november(), new Date(2026, 11, 1, 0, 0, 30));
    expect(closed.status).toBe("closed");
    expect(closed.closedAt).toBe("2026-12-01T00:00:30");
    expect(closeMonth(closed, new Date(2026, 11, 2))).toBe(closed);
  });
});

describe("PRD §13: moving leftover money", () => {
  // Spent ₹58,200 of ₹60,000, so ₹1,800 left in November
  const closed = november({ status: "closed", entries: [entry("saving", rupees(58_200))] });

  it("can't exceed the month's remaining amount", () => {
    expect(maxLeftover(closed, [goaTrip()])).toBe(rupees(1_800));
  });

  it("counts what's already been moved, so the total can never exceed it", () => {
    const moved = goaTrip({
      transactions: [txn("leftover", rupees(1_000), "2026-12-01T09:00:00", NOV)],
    });
    expect(leftoverMoved([moved], NOV)).toBe(rupees(1_000));
    expect(maxLeftover(closed, [moved])).toBe(rupees(800));

    const all = goaTrip({
      transactions: [txn("leftover", rupees(1_800), "2026-12-01T09:00:00", NOV)],
    });
    expect(canOfferLeftover(closed, [all])).toBe(false);
  });

  it("isn't offered when the month ended at ₹0 or below", () => {
    const zero = november({ status: "closed", entries: [entry("saving", rupees(60_000))] });
    const over = november({ status: "closed", entries: [entry("food", rupees(61_000))] });
    expect(canOfferLeftover(zero, [])).toBe(false);
    expect(canOfferLeftover(over, [])).toBe(false);
    expect(maxLeftover(over, [])).toBe(0);
  });

  it("is only offered for a closed month", () => {
    expect(canOfferLeftover(november(), [])).toBe(false);
    expect(canOfferLeftover(closed, [])).toBe(true);
  });
});

import { describe, expect, it } from "vitest";
import { bucketStatus, bucketUsed, headsUpFor, isAheadOfPace } from "./budget";
import { rupees } from "./money";
import { bucket, entry, november } from "./testing";
import { monthRemaining } from "./totals";

const DAYS = 30;

describe("PRD §7.5 worked examples: buckets", () => {
  it("1. Overspending: Leisure ₹1,200 + ₹1,300 is −₹500, over", () => {
    const entries = [entry("leisure", rupees(1_200)), entry("leisure", rupees(1_300))];
    const used = bucketUsed(entries, "leisure");
    expect(used).toBe(rupees(2_500));
    const status = bucketStatus("spend", bucket("leisure").allocated, used, 18, DAYS);
    expect(status).toEqual({ kind: "spend", state: "over", remaining: -rupees(500) });
  });

  it("2. Save bucket: ₹20,000 into Saving leaves ₹5,000 to put away", () => {
    const used = bucketUsed([entry("saving", rupees(20_000), { note: "Education" })], "saving");
    expect(bucketStatus("save", bucket("saving").allocated, used, 18, DAYS)).toEqual({
      kind: "save",
      state: "left",
      remaining: rupees(5_000),
    });
  });

  describe("3. Pace on 18 Nov (elapsed 0.60)", () => {
    const food = bucket("food");

    it("₹5,200 used: ₹2,800 left and on pace (0.65 vs 0.60 is within 0.15)", () => {
      const status = bucketStatus("spend", food.allocated, rupees(5_200), 18, DAYS);
      expect(status).toEqual({ kind: "spend", state: "ok", remaining: rupees(2_800) });
    });

    it("₹6,500 used: 0.8125 > 0.75, so ahead of pace, and the 80% heads-up fires", () => {
      expect(isAheadOfPace(food.allocated, rupees(6_500), 18, DAYS)).toBe(true);
      expect(bucketStatus("spend", food.allocated, rupees(6_500), 18, DAYS).state).toBe("ahead");
      expect(headsUpFor(food, rupees(6_500), []).show).toBe(80);
    });

    it("exactly on the line (0.75) is not ahead; one paisa more is", () => {
      expect(isAheadOfPace(food.allocated, rupees(6_000), 18, DAYS)).toBe(false);
      expect(isAheadOfPace(food.allocated, rupees(6_000) + 1, 18, DAYS)).toBe(true);
    });
  });

  it("4. Money back: a friend repays ₹400 into Food, so used drops by ₹400", () => {
    const spent = [entry("food", rupees(5_200))];
    const repaid = [...spent, entry("food", rupees(400), { type: "refund" })];
    expect(bucketUsed(spent, "food") - bucketUsed(repaid, "food")).toBe(rupees(400));
    expect(bucketUsed(repaid, "food")).toBe(rupees(4_800));
  });

  it("11. Saving more than planned: ₹16,000 into Investing is ₹1,000 extra, not over", () => {
    const status = bucketStatus("save", bucket("investing").allocated, rupees(16_000), 18, DAYS);
    expect(status).toEqual({ kind: "save", state: "extra", remaining: -rupees(1_000) });
    // Save buckets never get "over", pace or heads-ups
    expect(headsUpFor(bucket("investing"), rupees(16_000), []).show).toBeNull();
  });

  it("11. …and it doesn't change the month totals beyond the money itself", () => {
    const month = november({ entries: [entry("investing", rupees(16_000))] });
    expect(monthRemaining(month, [])).toBe(rupees(60_000 - 16_000));
  });
});

describe("save bucket states", () => {
  it("All put away at exactly ₹0 remaining", () => {
    expect(bucketStatus("save", rupees(15_000), rupees(15_000), 18, DAYS).state).toBe("done");
  });
});

describe("heads-ups (PRD §7.2)", () => {
  const food = bucket("food");

  it("80% fires at exactly 80% used, then 100% later, each once", () => {
    expect(headsUpFor(food, rupees(6_399), []).show).toBeNull();
    const at80 = headsUpFor(food, rupees(6_400), []);
    expect(at80).toEqual({ show: 80, record: [{ bucketId: "food", threshold: 80 }] });

    const shown = at80.record;
    expect(headsUpFor(food, rupees(7_000), shown).show).toBeNull();
    expect(headsUpFor(food, rupees(8_000), shown)).toEqual({
      show: 100,
      record: [{ bucketId: "food", threshold: 100 }],
    });
  });

  it("jumping straight past 100% shows only the 100% toast but records both", () => {
    expect(headsUpFor(food, rupees(9_000), [])).toEqual({
      show: 100,
      record: [
        { bucketId: "food", threshold: 80 },
        { bucketId: "food", threshold: 100 },
      ],
    });
  });

  it("other buckets' alerts don't count", () => {
    expect(headsUpFor(food, rupees(6_500), [{ bucketId: "commute", threshold: 80 }]).show).toBe(80);
  });
});

describe("PRD §13: bucket allocated ₹0", () => {
  const groceries = { id: "groceries", kind: "spend" as const, allocated: 0 };

  it("any spending makes it negative and over", () => {
    expect(bucketStatus("spend", 0, rupees(1), 3, DAYS)).toEqual({
      kind: "spend",
      state: "over",
      remaining: -rupees(1),
    });
  });

  it("with nothing spent it's ₹0 and not ahead of pace", () => {
    expect(bucketStatus("spend", 0, 0, 3, DAYS)).toEqual({
      kind: "spend",
      state: "ok",
      remaining: 0,
    });
  });

  it("fires the 100% heads-up on its first expense (decision a)", () => {
    expect(headsUpFor(groceries, 0, []).show).toBeNull();
    expect(headsUpFor(groceries, rupees(50), [])).toEqual({
      show: 100,
      record: [{ bucketId: "groceries", threshold: 100 }],
    });
  });
});

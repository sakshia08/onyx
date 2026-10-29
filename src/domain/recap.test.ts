import { describe, expect, it } from "vitest";
import { rupees } from "./money";
import { monthRecap } from "./recap";
import { appStage, markRecapSeen, maxLeftover, moveLeftover } from "./rollover";
import { entry, goaTrip, november, txn } from "./testing";
import type { Month } from "./types";

const october: Month = {
  ...november({
    entries: [
      entry("food", rupees(4_000), { date: "2026-10-10T12:00:00" }),
      entry("commute", rupees(3_000), { date: "2026-10-11T12:00:00" }),
    ],
  }),
  key: "2026-10",
  status: "closed",
};

const nov = november({
  status: "closed",
  entries: [
    entry("food", rupees(5_000), { date: "2026-11-02T12:00:00", note: "Groceries" }),
    entry("food", rupees(1_200), { date: "2026-11-09T12:00:00" }),
    entry("leisure", rupees(2_500), { date: "2026-11-12T12:00:00", note: "Concert" }),
    entry("saving", rupees(25_000), { date: "2026-11-03T12:00:00" }),
  ],
});

describe("the month recap (PRD §8.8)", () => {
  const piggy = goaTrip({
    transactions: [
      txn("stash", rupees(4_000), "2026-10-05T10:00:00"),
      txn("stash", rupees(6_000), "2026-11-05T10:00:00"),
    ],
  });
  const recap = monthRecap(nov, { "2026-10": october, "2026-11": nov }, [piggy]);

  it("1. budget, used and left (stashes count as used)", () => {
    expect(recap.budget).toBe(rupees(60_000));
    expect(recap.used).toBe(rupees(5_000 + 1_200 + 2_500 + 25_000 + 6_000));
    expect(recap.left).toBe(rupees(60_000 - 39_700));
  });

  it("2. which spend buckets stayed within budget and which went over, by how much", () => {
    expect(recap.within.map((r) => r.bucket.id)).toEqual(["commute", "food"]);
    expect(recap.over.map((r) => [r.bucket.id, r.remaining])).toEqual([["leisure", -rupees(500)]]);
    expect(recap.saved.map((r) => r.bucket.id)).toEqual(["investing", "saving"]);
  });

  it("3. the biggest expense (spend buckets only) and the most-used spend bucket", () => {
    expect(recap.biggest?.note).toBe("Groceries");
    expect(recap.mostUsed?.bucket.id).toBe("food");
    expect(recap.mostUsed?.used).toBe(rupees(6_200));
  });

  it("4. compared with last month, per bucket (+55% Food, −100% Commute, New for new money)", () => {
    const byId = Object.fromEntries(
      (recap.comparison?.rows ?? []).map((r) => [r.bucket.id, r.change]),
    );
    expect(recap.comparison?.previousKey).toBe("2026-10");
    expect(byId.food).toBe(55); // 4,000 → 6,200
    expect(byId.commute).toBe(-100);
    expect(byId.leisure).toBe("new");
    expect(byId.investing).toBe(0);
  });

  it("4. has no comparison without a previous month", () => {
    expect(monthRecap(nov, { "2026-11": nov }, []).comparison).toBeNull();
  });

  it("5. piggies: total stashed and progress made", () => {
    expect(recap.stashed).toBe(rupees(6_000));
    expect(recap.piggies).toEqual([{ piggy, before: rupees(4_000), after: rupees(10_000) }]);
  });

  it("5. includes piggies with no stash this month, but not ones finished earlier or created later", () => {
    const quiet = goaTrip({ id: "quiet", createdAt: "2026-09-01T09:00:00" });
    const later = goaTrip({ id: "later", createdAt: "2026-12-02T09:00:00" });
    const old = goaTrip({
      id: "old",
      createdAt: "2026-01-01T09:00:00",
      status: "completed",
      completedAt: "2026-06-01T09:00:00",
    });
    const ids = monthRecap(nov, { "2026-11": nov }, [quiet, later, old]).piggies.map(
      (p) => p.piggy.id,
    );
    expect(ids).toEqual(["quiet"]);
  });
});

describe("leftover to piggy (PRD §8.6)", () => {
  const closed = november({ status: "closed", entries: [entry("saving", rupees(58_200))] });

  it("records a leftover deposit on the piggy, dated now, from the closed month", () => {
    const moved = moveLeftover(
      closed,
      [goaTrip()],
      goaTrip(),
      rupees(1_000),
      "l1",
      new Date(2026, 11, 1, 9, 0),
    );
    expect(moved?.transactions).toEqual([
      {
        id: "l1",
        type: "leftover",
        amount: rupees(1_000),
        date: "2026-12-01T09:00:00",
        monthKey: "2026-11",
        createdAt: "2026-12-01T09:00:00",
      },
    ]);
    if (moved) expect(maxLeftover(closed, [moved])).toBe(rupees(800));
  });

  it("can't move more than what's left, or from an active month", () => {
    expect(moveLeftover(closed, [], goaTrip(), rupees(1_801), "x", new Date())).toBeNull();
    expect(moveLeftover(november(), [], goaTrip(), rupees(1), "x", new Date())).toBeNull();
  });
});

describe("where the app should be (PRD §8.8)", () => {
  it("welcome → month → recap → setup → month", () => {
    expect(appStage({ activeMonthKey: null, months: {} })).toBe("welcome");
    expect(appStage({ activeMonthKey: "2026-11", months: { "2026-11": november() } })).toBe(
      "month",
    );
    const closed = november({ status: "closed" });
    expect(appStage({ activeMonthKey: "2026-11", months: { "2026-11": closed } })).toBe("recap");
    const seen = markRecapSeen(closed, new Date(2026, 11, 1));
    expect(seen.recapSeenAt).toBe("2026-12-01T00:00:00");
    expect(appStage({ activeMonthKey: "2026-11", months: { "2026-11": seen } })).toBe("setup");
  });

  it("marking the recap seen twice keeps the first time", () => {
    const seen = markRecapSeen(november({ status: "closed" }), new Date(2026, 11, 1));
    expect(markRecapSeen(seen, new Date(2026, 11, 5))).toBe(seen);
  });
});

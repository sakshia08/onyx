import { describe, expect, it } from "vitest";
import { groupActivityByDay, monthActivity } from "./activity";
import { rupees } from "./money";
import { piggyBalance, piggyStatus } from "./piggy";
import {
  autoStashId,
  createPiggy,
  daysToGo,
  justReachedGoal,
  markDone,
  monthlyPreview,
  moveBalance,
  nearestPiggy,
  piggyProblem,
  piggySummary,
  removeTxn,
  reopen,
  restoreTxn,
  runAutoStash,
  spendFrom,
  startedNewCycle,
  stashInto,
  updatePiggy,
  type PiggyDraft,
} from "./piggy-actions";
import { entry, goaTrip, NOV, november, txn } from "./testing";
import { monthRemaining, monthUsed } from "./totals";

const draft: PiggyDraft = {
  name: " Goa trip ",
  emoji: "🌴",
  target: rupees(30_000),
  targetDate: "2027-03-15",
  repeat: "none",
  autoStash: false,
};
const NOW = new Date(2026, 10, 18, 20, 0);

describe("creating a piggy (PRD §8.6)", () => {
  it("keeps 'Already saved' as an opening balance", () => {
    const p = createPiggy(draft, rupees(2_000), { piggy: "goa", opening: "t1" }, NOW);
    expect(p).toMatchObject({
      id: "goa",
      name: "Goa trip",
      status: "active",
      createdAt: "2026-11-18T20:00:00",
    });
    expect(p.transactions).toEqual([
      {
        id: "t1",
        type: "opening",
        amount: rupees(2_000),
        date: "2026-11-18T20:00:00",
        monthKey: NOV,
        createdAt: "2026-11-18T20:00:00",
      },
    ]);
    expect(createPiggy(draft, 0, { piggy: "g", opening: "t" }, NOW).transactions).toEqual([]);
  });

  it("checks the name, target, date and opening amount", () => {
    expect(piggyProblem(draft, 0, "2026-11-18")).toBeNull();
    expect(piggyProblem({ ...draft, name: " " }, 0, "2026-11-18")).toBe("name-missing");
    expect(piggyProblem({ ...draft, target: 0 }, 0, "2026-11-18")).toBe("target");
    expect(piggyProblem({ ...draft, targetDate: "2026-11-17" }, 0, "2026-11-18")).toBe("date-past");
    expect(piggyProblem(draft, -1, "2026-11-18")).toBe("opening");
    const noDate: PiggyDraft = { ...draft };
    delete noDate.targetDate;
    expect(piggyProblem(noDate, 0, "2026-11-18")).toBeNull();
    expect(piggyProblem({ ...noDate, repeat: "yearly" }, 0, "2026-11-18")).toBe(
      "yearly-needs-date",
    );
  });

  it("shows '₹6,000/month for 5 months' while typing (PRD §8.6)", () => {
    expect(monthlyPreview(rupees(30_000), 0, "2027-03-15", "2026-11-01")).toEqual({
      perMonth: rupees(6_000),
      months: 5,
    });
    expect(monthlyPreview(rupees(30_000), rupees(6_000), "2027-03-15", "2026-11-01")).toEqual({
      perMonth: rupees(4_800),
      months: 5,
    });
    expect(monthlyPreview(rupees(30_000), 0, undefined, "2026-11-01")).toBeNull();
  });

  it("editing changes details, never the history; a removed date goes away", () => {
    const p = goaTrip({ transactions: [txn("stash", rupees(1_000), "2026-11-05T10:00:00")] });
    const noDate: PiggyDraft = { ...draft, name: "Goa", target: rupees(40_000) };
    delete noDate.targetDate;
    const edited = updatePiggy(p, noDate);
    expect(edited).toMatchObject({ name: "Goa", target: rupees(40_000) });
    expect(edited.targetDate).toBeUndefined();
    expect(edited.transactions).toEqual(p.transactions);
  });
});

describe("stashing and spending", () => {
  it("PRD §8.6 AC: stashes reduce the month's remaining; piggy spends don't", () => {
    const month = november();
    let p = stashInto(goaTrip(), rupees(6_000), "s1", NOW);
    expect(monthRemaining(month, [p])).toBe(rupees(54_000));
    p = spendFrom(p, rupees(2_000), "x1", "2026-11-20T10:00:00", "Flights");
    expect(monthRemaining(month, [p])).toBe(rupees(54_000));
    expect(piggyBalance(p)).toBe(rupees(4_000));
  });

  it("Undo removes and restores a transaction exactly", () => {
    const p = stashInto(goaTrip(), rupees(1_000), "s1", NOW);
    const { piggy: without, removed } = removeTxn(p, "s1");
    expect(without.transactions).toEqual([]);
    expect(removed).not.toBeNull();
    if (removed) expect(restoreTxn(without, removed)).toEqual(p);
  });

  it("ignores ₹0", () => {
    const p = goaTrip();
    expect(stashInto(p, 0, "s", NOW)).toBe(p);
    expect(spendFrom(p, 0, "x", "2026-11-20T10:00:00")).toBe(p);
  });
});

describe("goal reached (PRD §8.6)", () => {
  it("fires only the first time the balance reaches the target", () => {
    const before = stashInto(goaTrip(), rupees(29_000), "a", NOW);
    const after = stashInto(before, rupees(1_000), "b", NOW);
    expect(justReachedGoal(before, after)).toBe(true);
    expect(justReachedGoal(after, stashInto(after, rupees(500), "c", NOW))).toBe(false);
  });

  it("'Mark as done' shows saved vs spent; it can be reopened", () => {
    const p = spendFrom(
      stashInto(goaTrip(), rupees(30_000), "a", NOW),
      rupees(28_500),
      "x",
      "2027-03-10T10:00:00",
    );
    expect(piggySummary(p)).toEqual({ saved: rupees(30_000), spent: rupees(28_500) });
    const done = markDone(p, NOW);
    expect(done).toMatchObject({ status: "completed", completedAt: "2026-11-18T20:00:00" });
    expect(reopen(done)).toMatchObject({ status: "active" });
    expect(reopen(done).completedAt).toBeUndefined();
  });

  it("moves what's left into another piggy without touching the month", () => {
    const from = spendFrom(
      stashInto(goaTrip(), rupees(30_000), "a", NOW),
      rupees(28_500),
      "x",
      "2026-11-10T10:00:00",
    );
    const to = goaTrip({ id: "phone", name: "New phone", transactions: [] });
    const moved = moveBalance(from, to, { out: "o", in: "i" }, NOW);
    expect(piggyBalance(moved.from)).toBe(0);
    expect(piggyBalance(moved.to)).toBe(rupees(1_500));
    expect(moved.to.transactions[0]).toMatchObject({ type: "opening", note: "From Goa trip" });
    expect(monthUsed(november(), [moved.from, moved.to])).toBe(rupees(30_000)); // only the original stash
  });
});

describe("auto-stash (PRD §8.6)", () => {
  const auto = goaTrip({ autoStash: true, createdAt: "2026-10-05T09:00:00" });
  const month = november(); // plan: ₹6,000

  it("stashes the month's plan once setup is done, exactly once", () => {
    const first = runAutoStash([auto], month, NOW);
    expect(first.stashed).toBe(1);
    expect(first.piggies[0]?.transactions).toEqual([
      expect.objectContaining({
        id: autoStashId("goa", NOV),
        type: "stash",
        amount: rupees(6_000),
        note: "Auto-stash",
      }),
    ]);
    const again = runAutoStash(first.piggies, month, NOW);
    expect(again.stashed).toBe(0);
    expect(again.piggies[0]?.transactions).toHaveLength(1);
  });

  it("only stashes what's left of the plan", () => {
    const partly = { ...auto, transactions: [txn("stash", rupees(2_000), "2026-11-02T10:00:00")] };
    expect(runAutoStash([partly], month, NOW).piggies[0]?.transactions.at(-1)?.amount).toBe(
      rupees(4_000),
    );
  });

  it("waits until next month for a piggy created this month, and skips done or manual piggies", () => {
    const fresh = { ...auto, createdAt: "2026-11-10T09:00:00" };
    expect(runAutoStash([fresh, goaTrip(), markDone(auto, NOW)], month, NOW).stashed).toBe(0);
  });

  it("never stashes into a closed month or another month", () => {
    expect(runAutoStash([auto], { ...month, status: "closed" }, NOW).stashed).toBe(0);
    expect(runAutoStash([auto], month, new Date(2026, 11, 2)).stashed).toBe(0);
  });
});

describe("Home and Piggy tab helpers", () => {
  it("days to go, and the nearest piggy (no date last, done ones hidden)", () => {
    const soon = goaTrip({ id: "diwali", targetDate: "2026-11-30" });
    const noDate = goaTrip({ id: "fund" });
    delete noDate.targetDate;
    expect(daysToGo(soon, "2026-11-18")).toBe(12);
    expect(daysToGo(noDate, "2026-11-18")).toBeNull();
    expect(nearestPiggy([noDate, goaTrip(), soon], "2026-11-18")?.id).toBe("diwali");
    expect(nearestPiggy([markDone(soon, NOW)], "2026-11-18")).toBeNull();
  });

  it("notes when a yearly piggy has just started a new cycle", () => {
    const insurance = goaTrip({ repeat: "yearly" });
    expect(startedNewCycle(insurance, "2027-03-16")).toBe(true);
    expect(startedNewCycle(insurance, "2027-04-02")).toBe(false);
    expect(startedNewCycle(insurance, "2027-03-10")).toBe(false);
    expect(piggyStatus(insurance, "2027-03-16").kind).not.toBe("date-passed");
  });
});

describe("Activity with piggies (PRD §8.5)", () => {
  it("lists this month's stashes and spends; spends don't count in the day's total", () => {
    const p = goaTrip({
      transactions: [
        txn("opening", rupees(1_000), "2026-11-18T08:00:00"),
        txn("stash", rupees(2_000), "2026-11-18T09:00:00"),
        txn("spend", rupees(500), "2026-11-18T10:00:00"),
        txn("stash", rupees(9_000), "2026-10-18T09:00:00"),
      ],
    });
    const items = monthActivity(
      [entry("food", rupees(300), { date: "2026-11-18T12:00:00" })],
      [p],
      NOV,
    );
    expect(items).toHaveLength(3);
    const [today] = groupActivityByDay(items, "2026-11-18");
    expect(today?.total).toBe(rupees(2_300));
    expect(today?.items.map((i) => (i.kind === "entry" ? "entry" : i.txn.type))).toEqual([
      "entry",
      "spend",
      "stash",
    ]);
  });
});

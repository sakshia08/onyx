import { describe, expect, it } from "vitest";
import { bucketUsed } from "./budget";
import { rupees } from "./money";
import {
  dueToAsk,
  logRecurring,
  missedWhenCreated,
  occurrenceDay,
  recurringState,
  runAutoRecurring,
  skipRecurring,
  upcomingForBucket,
} from "./recurring";
import { bucket, entry, newId, november, rule } from "./testing";

const NOW = "2026-11-28T08:00:00";

describe("PRD §7.5 example 5: upcoming recurring", () => {
  const netflix = rule();
  const month = november({ entries: [entry("leisure", rupees(1_200))] });
  const leisure = bucket("leisure");

  it("on 18 Nov: remaining ₹800 and upcoming ₹649", () => {
    expect(leisure.allocated - bucketUsed(month.entries, "leisure")).toBe(rupees(800));
    expect(upcomingForBucket([netflix], month, 18, "leisure")).toBe(rupees(649));
  });

  it("on 28 Nov, once Netflix is logged: upcoming ₹0 and remaining ₹151", () => {
    const after = runAutoRecurring(month, [netflix], 28, newId, NOW);
    expect(upcomingForBucket([netflix], after, 28, "leisure")).toBe(0);
    expect(leisure.allocated - bucketUsed(after.entries, "leisure")).toBe(rupees(151));
  });

  it("the logged entry is dated on the rule's day at 09:00, from 'recurring'", () => {
    const after = runAutoRecurring(month, [netflix], 28, newId, NOW);
    const logged = after.entries.find((e) => e.recurringRuleId === "netflix");
    expect(logged).toMatchObject({
      date: "2026-11-28T09:00:00",
      amount: rupees(649),
      bucketId: "leisure",
      source: "recurring",
      note: "Netflix",
    });
    expect(after.recurringLog).toEqual([
      { ruleId: "netflix", status: "logged", entryId: logged?.id },
    ]);
  });
});

describe("PRD §7.5 example 9: the day 31 rule", () => {
  const rent = rule({ id: "rent", dayOfMonth: 31 });

  it("lands on the 30th in a 30-day month", () => {
    expect(occurrenceDay(rent, { key: "2026-11" })).toBe(30);
    expect(occurrenceDay(rent, { key: "2026-12" })).toBe(31);
    const after = runAutoRecurring(november(), [rent], 30, newId, NOW);
    expect(after.entries[0]?.date).toBe("2026-11-30T09:00:00");
  });

  it("lands on the 28th in February, and the 29th in leap years", () => {
    expect(occurrenceDay(rent, { key: "2027-02" })).toBe(28);
    expect(occurrenceDay(rent, { key: "2028-02" })).toBe(29);
  });
});

describe("PRD §8.7 AC: never logs twice", () => {
  const rent = rule({
    id: "rent",
    name: "Rent",
    dayOfMonth: 1,
    amount: rupees(15_000),
    bucketId: "saving",
  });
  const sip = rule({
    id: "sip",
    name: "SIP",
    dayOfMonth: 5,
    amount: rupees(5_000),
    bucketId: "investing",
  });

  it("opening on the 10th after the 1st logs rent and the SIP exactly once each", () => {
    const onThe1st = runAutoRecurring(november(), [rent, sip], 1, newId, "2026-11-01T08:00:00");
    expect(onThe1st.entries.map((e) => e.recurringRuleId)).toEqual(["rent"]);

    const onThe10th = runAutoRecurring(onThe1st, [rent, sip], 10, newId, "2026-11-10T08:00:00");
    expect(onThe10th.entries.map((e) => e.recurringRuleId)).toEqual(["rent", "sip"]);

    // Every later check (each minute, each return to the app) changes nothing
    const again = runAutoRecurring(onThe10th, [rent, sip], 10, newId, "2026-11-10T08:01:00");
    expect(again).toBe(onThe10th);
  });

  it("doesn't re-log if the log is missing but the entry exists", () => {
    const month = november({
      entries: [entry("saving", rupees(15_000), { recurringRuleId: "rent" })],
    });
    expect(runAutoRecurring(month, [rent], 10, newId, NOW).entries).toHaveLength(1);
  });

  it("logRecurring on an already handled rule changes nothing", () => {
    const once = logRecurring(november(), rent, newId, NOW);
    expect(logRecurring(once, rent, newId, NOW)).toBe(once);
  });
});

describe("ask first, skip and inactive rules", () => {
  const ask = rule({ mode: "ask", dayOfMonth: 10 });

  it("'Ask me first' rules wait under Due now instead of logging", () => {
    const month = november();
    expect(runAutoRecurring(month, [ask], 12, newId, NOW)).toBe(month);
    expect(dueToAsk([ask], month, 12)).toEqual([ask]);
    expect(dueToAsk([ask], month, 9)).toEqual([]);
  });

  it("a skipped item stays skipped for the month and leaves upcoming", () => {
    const skipped = skipRecurring(november(), ask.id);
    expect(recurringState(ask, skipped, 12)).toBe("skipped");
    expect(dueToAsk([ask], skipped, 20)).toEqual([]);
    expect(logRecurring(skipped, ask, newId, NOW)).toBe(skipped);
  });

  it("inactive rules never log and aren't upcoming", () => {
    const off = rule({ active: false });
    expect(runAutoRecurring(november(), [off], 30, newId, NOW).entries).toHaveLength(0);
    expect(upcomingForBucket([off], november(), 1, "leisure")).toBe(0);
  });

  it("closed months are never changed", () => {
    const closed = november({ status: "closed" });
    expect(runAutoRecurring(closed, [rule()], 30, newId, NOW)).toBe(closed);
  });
});

describe("PRD §13 recurring edge cases", () => {
  it("a rule whose bucket was removed shows as 'Needs a bucket' and never logs", () => {
    const orphan = rule({ bucketId: "gone" });
    expect(recurringState(orphan, november(), 28)).toBe("needs-bucket");
    expect(runAutoRecurring(november(), [orphan], 30, newId, NOW).entries).toHaveLength(0);
  });

  it("a rule created after its day has passed asks whether to log it this month", () => {
    expect(missedWhenCreated({ dayOfMonth: 5 }, { key: "2026-11" }, 18)).toBe(true);
    expect(missedWhenCreated({ dayOfMonth: 18 }, { key: "2026-11" }, 18)).toBe(false);
    expect(missedWhenCreated({ dayOfMonth: 25 }, { key: "2026-11" }, 18)).toBe(false);
  });
});

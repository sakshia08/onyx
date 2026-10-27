/**
 * Piggy banks (PRD §7.4): savings goals that span months. Integer paise only.
 * "today" is a local day ("2026-12-01"); the month is taken from it.
 */

import { addYearsToDay, monthKeyOf, monthsInclusive, monthStartISO, nextDay } from "./dates";
import { ceilDiv, floorDiv, roundUpToRupee, sumPaise, type Paise } from "./money";
import type { DayKey, Month, MonthKey, Piggy, PiggyTxn } from "./types";

function signed(t: PiggyTxn): Paise {
  return t.type === "spend" ? -t.amount : t.amount;
}

/** opening + stashes + leftovers − spends. Can be negative. */
export function piggyBalance(piggy: Pick<Piggy, "transactions">): Paise {
  return sumPaise(piggy.transactions.map(signed));
}

/** balance / target, clamped to 0–1. For visuals only. */
export function piggyProgress(piggy: Pick<Piggy, "transactions" | "target">): number {
  if (piggy.target <= 0) return piggyBalance(piggy) > 0 ? 1 : 0;
  return Math.min(1, Math.max(0, piggyBalance(piggy) / piggy.target));
}

/**
 * Money the piggy had when the month started: every transaction dated before the month,
 * plus leftover moves and opening balances made during the month (that money existed
 * before the month, so it counts as start-of-month money).
 */
export function balanceAtStartOfMonth(piggy: Pick<Piggy, "transactions">, key: MonthKey): Paise {
  const start = monthStartISO(key);
  return sumPaise(
    piggy.transactions
      .filter(
        (t) =>
          t.date < start ||
          ((t.type === "leftover" || t.type === "opening") && monthKeyOf(t.date) === key),
      )
      .map(signed),
  );
}

/** Stashes into this piggy counted in this month (not leftovers, not spends). */
export function stashedIntoThisMonth(piggy: Pick<Piggy, "transactions">, key: MonthKey): Paise {
  return sumPaise(
    piggy.transactions.filter((t) => t.type === "stash" && t.monthKey === key).map((t) => t.amount),
  );
}

export interface PiggyCycle {
  /** The month this cycle's maths counts from: creation, or the day after the last target date. */
  startMonth: MonthKey;
  targetDate: DayKey;
}

/**
 * The cycle that contains today. One-time piggies have one cycle. Yearly piggies roll on:
 * a cycle starts the day after the previous target date and is due one year later.
 * Null when there's no target date.
 */
export function currentCycle(
  piggy: Pick<Piggy, "createdAt" | "targetDate" | "repeat">,
  today: DayKey,
): PiggyCycle | null {
  if (piggy.targetDate === undefined) return null;
  let startMonth = monthKeyOf(piggy.createdAt);
  let targetDate = piggy.targetDate;
  if (piggy.repeat === "yearly") {
    while (today > targetDate) {
      startMonth = monthKeyOf(nextDay(targetDate));
      targetDate = addYearsToDay(targetDate, 1);
    }
  }
  return { startMonth, targetDate };
}

/** Months from this month to the target month, both included, at least 1. */
export function monthsLeft(key: MonthKey, targetDate: DayKey): number {
  return Math.max(1, monthsInclusive(key, monthKeyOf(targetDate)));
}

/**
 * What to put in this month: (target − start-of-month balance) ÷ months left, rounded up to
 * the whole rupee. Null when there's no target date (progress only).
 */
export function suggestedThisMonth(piggy: Piggy, today: DayKey): Paise | null {
  const cycle = currentCycle(piggy, today);
  if (cycle === null) return null;
  const key = monthKeyOf(today);
  const needed = Math.max(0, piggy.target - balanceAtStartOfMonth(piggy, key));
  return roundUpToRupee(ceilDiv(needed, monthsLeft(key, cycle.targetDate)));
}

/** The plan from this month's setup, or the suggestion when there's no plan. */
export function plannedThisMonth(
  piggy: Piggy,
  month: Pick<Month, "piggyPlans"> | undefined,
  today: DayKey,
): Paise {
  const plan = month?.piggyPlans.find((p) => p.piggyId === piggy.id);
  return plan?.planned ?? suggestedThisMonth(piggy, today) ?? 0;
}

/** What's still to stash this month, for the Stash button. */
export function toStashThisMonth(
  piggy: Piggy,
  month: Pick<Month, "piggyPlans"> | undefined,
  today: DayKey,
): Paise {
  const planned = plannedThisMonth(piggy, month, today);
  return Math.max(0, planned - stashedIntoThisMonth(piggy, monthKeyOf(today)));
}

/**
 * Where the balance "should" be when this month starts:
 * target × months since the cycle started ÷ months in the cycle (both ends included).
 */
export function expectedAtStartOfMonth(piggy: Piggy, today: DayKey): Paise | null {
  const cycle = currentCycle(piggy, today);
  if (cycle === null) return null;
  const totalMonths = Math.max(1, monthsInclusive(cycle.startMonth, monthKeyOf(cycle.targetDate)));
  const since = Math.min(
    totalMonths,
    Math.max(0, monthsInclusive(cycle.startMonth, monthKeyOf(today)) - 1),
  );
  return floorDiv(piggy.target * since, totalMonths);
}

export type PiggyStatus =
  | { kind: "done" }
  | { kind: "on-track" }
  | { kind: "behind"; by: Paise }
  | { kind: "date-passed" }
  | { kind: "no-date" };

export function piggyStatus(piggy: Piggy, today: DayKey): PiggyStatus {
  if (piggyBalance(piggy) >= piggy.target) return { kind: "done" };
  const cycle = currentCycle(piggy, today);
  if (cycle === null) return { kind: "no-date" };
  if (piggy.repeat === "none" && today > cycle.targetDate) return { kind: "date-passed" };
  const expected = expectedAtStartOfMonth(piggy, today) ?? 0;
  const atStart = balanceAtStartOfMonth(piggy, monthKeyOf(today));
  return atStart >= expected ? { kind: "on-track" } : { kind: "behind", by: expected - atStart };
}

/** Left to reach the target, never below zero. */
export function piggyToGo(piggy: Piggy): Paise {
  return Math.max(0, piggy.target - piggyBalance(piggy));
}

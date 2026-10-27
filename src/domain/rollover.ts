/**
 * Month rollover (PRD §8.8) and leftover to piggy (PRD §8.6).
 * Leftover money ends with its month; the only way it leaves is a "leftover" move into a piggy.
 */

import { compareMonthKeys, monthKeyOfDate, toISODate } from "./dates";
import { sumPaise, type Paise } from "./money";
import { monthRemaining } from "./totals";
import type { Month, MonthKey, Piggy } from "./types";

export type MonthCheck =
  /** No month has been set up yet: show setup. */
  | { kind: "no-month" }
  | { kind: "same" }
  /** The calendar has moved past the active month: close it, recap, then set up `current`. */
  | { kind: "rollover"; closing: MonthKey; current: MonthKey }
  /** The clock went backwards. Do nothing destructive; show a small warning. */
  | { kind: "clock-back"; active: MonthKey; current: MonthKey };

/**
 * Compares the active month with today. Months the app was never opened in are skipped,
 * not created (PRD §13).
 */
export function checkMonth(activeMonthKey: MonthKey | null, now: Date): MonthCheck {
  const current = monthKeyOfDate(now);
  if (activeMonthKey === null) return { kind: "no-month" };
  const order = compareMonthKeys(current, activeMonthKey);
  if (order === 0) return { kind: "same" };
  if (order > 0) return { kind: "rollover", closing: activeMonthKey, current };
  return { kind: "clock-back", active: activeMonthKey, current };
}

/** Closes a month: it becomes read-only. Closing an already closed month changes nothing. */
export function closeMonth(month: Month, now: Date): Month {
  if (month.status === "closed") return month;
  return { ...month, status: "closed", closedAt: toISODate(now) };
}

/** Money already moved out of a month into piggies. */
export function leftoverMoved(piggies: readonly Piggy[], fromKey: MonthKey): Paise {
  return sumPaise(
    piggies.flatMap((p) =>
      p.transactions
        .filter((t) => t.type === "leftover" && t.monthKey === fromKey)
        .map((t) => t.amount),
    ),
  );
}

/** The most that can still be moved out of a month: its remaining, minus what's been moved. */
export function maxLeftover(month: Month, piggies: readonly Piggy[]): Paise {
  return Math.max(0, monthRemaining(month, piggies) - leftoverMoved(piggies, month.key));
}

/** Offered only for a closed month that ended above ₹0 with something still to move. */
export function canOfferLeftover(month: Month, piggies: readonly Piggy[]): boolean {
  return month.status === "closed" && maxLeftover(month, piggies) > 0;
}

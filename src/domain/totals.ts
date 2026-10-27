/**
 * Month totals (PRD §7.3). Integer paise only.
 */

import { bucketUsed } from "./budget";
import { sumPaise, type Paise } from "./money";
import type { Month, MonthKey, Piggy } from "./types";

/** Sum of bucket allocations plus piggy plans. */
export function allocatedTotal(month: Pick<Month, "buckets" | "piggyPlans">): Paise {
  return (
    sumPaise(month.buckets.map((b) => b.allocated)) +
    sumPaise(month.piggyPlans.map((p) => p.planned))
  );
}

/** Budget not yet given to a bucket or piggy. Negative means over-allocated (allowed, with a warning). */
export function unallocated(month: Pick<Month, "totalBudget" | "buckets" | "piggyPlans">): Paise {
  return month.totalBudget - allocatedTotal(month);
}

/** Stashes into any piggy dated in this month. Leftover moves and piggy spends don't count. */
export function stashedThisMonth(piggies: readonly Piggy[], key: MonthKey): Paise {
  return sumPaise(
    piggies.flatMap((p) =>
      p.transactions.filter((t) => t.type === "stash" && t.monthKey === key).map((t) => t.amount),
    ),
  );
}

/** All buckets' used, plus this month's stashes. */
export function monthUsed(month: Month, piggies: readonly Piggy[]): Paise {
  return (
    sumPaise(month.buckets.map((b) => bucketUsed(month.entries, b.id))) +
    stashedThisMonth(piggies, month.key)
  );
}

/** "Left this month": the hero number on Home. Can be negative. */
export function monthRemaining(month: Month, piggies: readonly Piggy[]): Paise {
  return month.totalBudget - monthUsed(month, piggies);
}

/**
 * The month-end recap (PRD §8.8): what a closed month looked like, as story cards.
 */

import { bucketUsed } from "./budget";
import { addMonthsToKey, monthStartISO, previousMonthKey } from "./dates";
import { roundDiv, sumPaise, type Paise } from "./money";
import { leftoverMoved } from "./rollover";
import { monthRemaining, monthUsed, stashedThisMonth } from "./totals";
import type { Bucket, Entry, Month, MonthKey, Piggy } from "./types";

export interface BucketResult {
  bucket: Bucket;
  used: Paise;
  remaining: Paise;
}

export interface BucketChange {
  bucket: Bucket;
  used: Paise;
  /** Percent change from the previous month, or "new" (PROGRESS decision f). */
  change: number | "new";
}

export interface PiggyProgress {
  piggy: Piggy;
  before: Paise;
  after: Paise;
}

export interface MonthRecap {
  key: MonthKey;
  budget: Paise;
  used: Paise;
  left: Paise;
  /** Spend buckets that stayed within budget, and those that went over. */
  within: BucketResult[];
  over: BucketResult[];
  saved: BucketResult[];
  biggest: Entry | null;
  mostUsed: BucketResult | null;
  /** Null when there's no previous month to compare with. */
  comparison: { previousKey: MonthKey; rows: BucketChange[] } | null;
  stashed: Paise;
  piggies: PiggyProgress[];
  /** Already moved out of this month into piggies. */
  moved: Paise;
}

/** Percent change from before to now, rounded; "new" when there was nothing before. */
export function percentChange(now: Paise, before: Paise): number | "new" {
  if (before === 0) return now === 0 ? 0 : "new";
  return roundDiv((now - before) * 100, before);
}

function balanceBefore(piggy: Piggy, iso: string): Paise {
  return sumPaise(
    piggy.transactions
      .filter((t) => t.date < iso)
      .map((t) => (t.type === "spend" ? -t.amount : t.amount)),
  );
}

export function monthRecap(
  month: Month,
  months: Readonly<Record<MonthKey, Month>>,
  piggies: readonly Piggy[],
): MonthRecap {
  const results = [...month.buckets]
    .sort((a, b) => a.order - b.order)
    .map((bucket) => {
      const used = bucketUsed(month.entries, bucket.id);
      return { bucket, used, remaining: bucket.allocated - used };
    });
  const spend = results.filter((r) => r.bucket.kind === "spend");

  // Money put away in a save bucket isn't spending, so only spend buckets count here
  const spendIds = new Set(spend.map((r) => r.bucket.id));
  const biggest = month.entries
    .filter((e) => e.type === "expense" && spendIds.has(e.bucketId))
    .reduce<Entry | null>((top, e) => (top === null || e.amount > top.amount ? e : top), null);
  const mostUsed = spend.reduce<BucketResult | null>(
    (top, r) => (r.used > 0 && (top === null || r.used > top.used) ? r : top),
    null,
  );

  const previous = months[previousMonthKey(month.key)];
  const comparison = previous
    ? {
        previousKey: previous.key,
        rows: results.map((r) => {
          const had = previous.buckets.some((b) => b.id === r.bucket.id);
          return {
            bucket: r.bucket,
            used: r.used,
            change: had
              ? percentChange(r.used, bucketUsed(previous.entries, r.bucket.id))
              : ("new" as const),
          };
        }),
      }
    : null;

  const start = monthStartISO(month.key);
  const end = monthStartISO(addMonthsToKey(month.key, 1));
  // Every piggy that existed this month and wasn't already finished before it
  const piggyProgress = piggies
    .filter((p) => p.createdAt < end && !(p.completedAt !== undefined && p.completedAt < start))
    .map((piggy) => ({
      piggy,
      before: balanceBefore(piggy, start),
      after: balanceBefore(piggy, end),
    }));

  return {
    key: month.key,
    budget: month.totalBudget,
    used: monthUsed(month, piggies),
    left: monthRemaining(month, piggies),
    within: spend.filter((r) => r.remaining >= 0),
    over: spend.filter((r) => r.remaining < 0),
    saved: results.filter((r) => r.bucket.kind === "save"),
    biggest,
    mostUsed,
    comparison,
    stashed: stashedThisMonth(piggies, month.key),
    piggies: piggyProgress,
    moved: leftoverMoved(piggies, month.key),
  };
}

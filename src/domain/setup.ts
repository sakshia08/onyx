/**
 * Monthly setup (PRD §8.2) and bucket management (PRD §13).
 */

import { bucketUsed } from "./budget";
import { compareMonthKeys } from "./dates";
import { roundDiv, roundToRupee, sumPaise, type Paise } from "./money";
import type { Bucket, ID, ISODate, Month, MonthKey, PiggyPlan, RecurringRule } from "./types";

/** First-launch buckets, all at ₹0 so I fill in my own amounts. */
export function defaultBuckets(newId: () => ID): Bucket[] {
  const defaults: Omit<Bucket, "id" | "order" | "allocated">[] = [
    { name: "Commute", emoji: "🚇", color: "blue", kind: "spend" },
    { name: "Food", emoji: "🍜", color: "orange", kind: "spend" },
    { name: "Leisure", emoji: "🎉", color: "rose", kind: "spend" },
    { name: "Investing", emoji: "📈", color: "green", kind: "save" },
    { name: "Saving", emoji: "🏦", color: "teal", kind: "save" },
  ];
  return defaults.map((b, order) => ({ ...b, id: newId(), order, allocated: 0 }));
}

export interface MonthPlan {
  totalBudget: Paise;
  buckets: Bucket[];
  piggyPlans: PiggyPlan[];
}

/** "Same as last month": the same budget and buckets, with the same ids. */
export function planFromPrevious(previous: Month): MonthPlan {
  return {
    totalBudget: previous.totalBudget,
    buckets: previous.buckets.map((b) => ({ ...b })),
    piggyPlans: previous.piggyPlans.map((p) => ({ ...p })),
  };
}

export type StartMonthResult =
  { ok: true; month: Month } | { ok: false; reason: "no-buckets" | "negative-amount" };

/** "Start November". Over-allocating is allowed; zero buckets is not. */
export function startMonth(key: MonthKey, plan: MonthPlan, now: ISODate): StartMonthResult {
  if (plan.buckets.length === 0) return { ok: false, reason: "no-buckets" };
  const amounts = [
    plan.totalBudget,
    ...plan.buckets.map((b) => b.allocated),
    ...plan.piggyPlans.map((p) => p.planned),
  ];
  if (amounts.some((a) => a < 0)) return { ok: false, reason: "negative-amount" };
  return {
    ok: true,
    month: {
      key,
      status: "active",
      totalBudget: plan.totalBudget,
      buckets: plan.buckets.map((b, order) => ({ ...b, order })),
      piggyPlans: plan.piggyPlans,
      entries: [],
      recurringLog: [],
      alertsShown: [],
      createdAt: now,
    },
  };
}

/**
 * "Avg ₹6,200": the average used over the last 3 closed months before `beforeKey` that had
 * this bucket, rounded to the whole rupee. Null when no closed month had it.
 */
export function averageUsed(
  months: readonly Month[],
  bucketId: ID,
  beforeKey: MonthKey,
): Paise | null {
  const recent = months
    .filter(
      (m) =>
        m.status === "closed" &&
        compareMonthKeys(m.key, beforeKey) < 0 &&
        m.buckets.some((b) => b.id === bucketId),
    )
    .sort((a, b) => compareMonthKeys(b.key, a.key))
    .slice(0, 3);
  if (recent.length === 0) return null;
  const total = sumPaise(recent.map((m) => bucketUsed(m.entries, bucketId)));
  return roundToRupee(roundDiv(total, recent.length));
}

/** Active recurring rules already committed to a bucket, for the "Rent ₹15,000 recurring" hint. */
export function committedRecurring(rules: readonly RecurringRule[], bucketId: ID): RecurringRule[] {
  return rules.filter((r) => r.active && r.bucketId === bucketId);
}

/** A bucket with entries can't be deleted until they're moved (PRD §13). */
export function canDeleteBucket(month: Month, bucketId: ID): boolean {
  return !month.entries.some((e) => e.bucketId === bucketId);
}

/** Moves every entry from one bucket to another, e.g. before deleting a bucket. */
export function moveEntries(month: Month, fromId: ID, toId: ID, now: ISODate): Month {
  if (month.status !== "active") return month;
  return {
    ...month,
    entries: month.entries.map((e) =>
      e.bucketId === fromId ? { ...e, bucketId: toId, updatedAt: now } : e,
    ),
  };
}

/** Deletes a bucket, if it has no entries. Returns the month unchanged otherwise. */
export function deleteBucket(month: Month, bucketId: ID): Month {
  if (month.status !== "active" || !canDeleteBucket(month, bucketId)) return month;
  return { ...month, buckets: month.buckets.filter((b) => b.id !== bucketId) };
}

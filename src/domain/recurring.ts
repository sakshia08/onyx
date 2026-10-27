/**
 * Recurring expenses (PRD §8.7, §7.2 `upcoming`). Pure functions: they return a new month
 * and never change the one passed in. Each rule is handled at most once per month.
 */

import { clampDayToMonth, isoForDay } from "./dates";
import { sumPaise, type Paise } from "./money";
import type { Entry, ID, ISODate, Month, RecurringRule } from "./types";

/** The day this rule lands on in the month (day 31 → the 30th, or the 28th/29th in February). */
export function occurrenceDay(
  rule: Pick<RecurringRule, "dayOfMonth">,
  month: Pick<Month, "key">,
): number {
  return clampDayToMonth(rule.dayOfMonth, month.key);
}

function isHandled(month: Month, ruleId: ID): boolean {
  return (
    month.recurringLog.some((l) => l.ruleId === ruleId) ||
    month.entries.some((e) => e.recurringRuleId === ruleId)
  );
}

export type RecurringState =
  "logged" | "skipped" | "due" | "upcoming" | "needs-bucket" | "inactive";

/** Where a rule stands this month, for "Due now" and "Coming up". */
export function recurringState(rule: RecurringRule, month: Month, today: number): RecurringState {
  const log = month.recurringLog.find((l) => l.ruleId === rule.id);
  if (log) return log.status;
  if (month.entries.some((e) => e.recurringRuleId === rule.id)) return "logged";
  if (!rule.active) return "inactive";
  if (!month.buckets.some((b) => b.id === rule.bucketId)) return "needs-bucket";
  return occurrenceDay(rule, month) <= today ? "due" : "upcoming";
}

/** Recurring expenses still to come this month for one bucket (PRD §7.2). */
export function upcomingForBucket(
  rules: readonly RecurringRule[],
  month: Month,
  today: number,
  bucketId: ID,
): Paise {
  return sumPaise(
    rules
      .filter((r) => r.bucketId === bucketId && recurringState(r, month, today) === "upcoming")
      .map((r) => r.amount),
  );
}

/** "Ask me first" rules waiting under "Due now". */
export function dueToAsk(
  rules: readonly RecurringRule[],
  month: Month,
  today: number,
): RecurringRule[] {
  return rules.filter((r) => r.mode === "ask" && recurringState(r, month, today) === "due");
}

function entryFor(rule: RecurringRule, month: Month, id: ID, now: ISODate): Entry {
  return {
    id,
    type: "expense",
    bucketId: rule.bucketId,
    amount: rule.amount,
    note: rule.name,
    // Dated on the rule's day at 09:00 (PRD §8.7)
    date: isoForDay(month.key, occurrenceDay(rule, month), 9, 0),
    createdAt: now,
    source: "recurring",
    recurringRuleId: rule.id,
  };
}

/** Logs one rule for this month (auto, or "Log" on a due item). Does nothing if already handled. */
export function logRecurring(
  month: Month,
  rule: RecurringRule,
  newId: () => ID,
  now: ISODate,
): Month {
  if (month.status !== "active" || isHandled(month, rule.id)) return month;
  if (!month.buckets.some((b) => b.id === rule.bucketId)) return month;
  const entry = entryFor(rule, month, newId(), now);
  return {
    ...month,
    entries: [...month.entries, entry],
    recurringLog: [...month.recurringLog, { ruleId: rule.id, status: "logged", entryId: entry.id }],
  };
}

/** "Skip" on a due item: stays skipped for the rest of the month. */
export function skipRecurring(month: Month, ruleId: ID): Month {
  if (month.status !== "active" || isHandled(month, ruleId)) return month;
  return { ...month, recurringLog: [...month.recurringLog, { ruleId, status: "skipped" }] };
}

/**
 * Runs on launch, on returning to the app and every minute: logs every due "auto" rule
 * exactly once. Running it again changes nothing.
 */
export function runAutoRecurring(
  month: Month,
  rules: readonly RecurringRule[],
  today: number,
  newId: () => ID,
  now: ISODate,
): Month {
  return rules
    .filter((r) => r.mode === "auto" && recurringState(r, month, today) === "due")
    .reduce((m, rule) => logRecurring(m, rule, newId, now), month);
}

/** A rule created after its day has passed this month: ask whether to log it now (PRD §13). */
export function missedWhenCreated(
  rule: Pick<RecurringRule, "dayOfMonth">,
  month: Pick<Month, "key">,
  today: number,
): boolean {
  return occurrenceDay(rule, month) < today;
}

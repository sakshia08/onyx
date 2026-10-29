/**
 * Recurring expenses (PRD §8.7, §7.2 `upcoming`). Pure functions: they return a new month
 * and never change the one passed in. Each rule is handled at most once per month.
 */

import { clampDayToMonth, isoForDay } from "./dates";
import { MAX_ENTRY_PAISE, sumPaise, type Paise } from "./money";
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

// ── Managing rules (PRD §8.7) ────────────────────────────────────────────

export interface RuleDraft {
  name: string;
  amount: Paise;
  bucketId: ID;
  dayOfMonth: number;
  mode: RecurringRule["mode"];
  active: boolean;
}

export type RuleProblem = "name-missing" | "amount" | "bucket" | "day";

export function ruleProblem(draft: RuleDraft, bucketIds: readonly ID[]): RuleProblem | null {
  if (draft.name.trim() === "") return "name-missing";
  if (!Number.isSafeInteger(draft.amount) || draft.amount <= 0 || draft.amount > MAX_ENTRY_PAISE) {
    return "amount";
  }
  if (!bucketIds.includes(draft.bucketId)) return "bucket";
  if (!Number.isInteger(draft.dayOfMonth) || draft.dayOfMonth < 1 || draft.dayOfMonth > 31)
    return "day";
  return null;
}

export function createRule(draft: RuleDraft, id: ID, now: ISODate): RecurringRule {
  return { id, ...draft, name: draft.name.trim(), createdAt: now };
}

/** Edits a rule. Entries it already logged stay as they are. */
export function updateRule(rule: RecurringRule, draft: RuleDraft): RecurringRule {
  return { ...rule, ...draft, name: draft.name.trim() };
}

export interface ComingUpItem {
  rule: RecurringRule;
  /** The day it lands on this month. */
  day: number;
  state: "upcoming" | "needs-bucket";
}

/** "Coming up" on Home (PRD §8.3): still to come this month, plus rules that need a bucket. */
export function comingUp(
  rules: readonly RecurringRule[],
  month: Month,
  today: number,
): ComingUpItem[] {
  return rules
    .map((rule) => ({
      rule,
      day: occurrenceDay(rule, month),
      state: recurringState(rule, month, today),
    }))
    .filter((i): i is ComingUpItem => i.state === "upcoming" || i.state === "needs-bucket")
    .sort((a, b) => a.day - b.day);
}

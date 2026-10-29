/**
 * Every change to saved data goes through here, built from the pure rules in src/domain.
 */

import { dayInMonth, monthKeyOfDate, toISODate } from "@/domain/dates";
import { recordBackup } from "@/domain/backup";
import {
  createRule,
  logRecurring,
  recurringState,
  runAutoRecurring,
  skipRecurring,
  updateRule,
  type RuleDraft,
} from "@/domain/recurring";
import {
  checkMonth,
  closeMonth,
  markRecapSeen,
  moveLeftover,
  type MonthCheck,
} from "@/domain/rollover";
import type { Paise } from "@/domain/money";
import {
  deleteBucket as deleteBucketRule,
  moveEntries,
  startMonth as startMonthRule,
  updateBucket as updateBucketRule,
  updateTotalBudget,
  type MonthPlan,
  type StartMonthResult,
} from "@/domain/setup";
import {
  addEntry,
  removeEntry,
  replaceEntry,
  restoreEntry,
  type HeadsUpToast,
} from "@/domain/entries";
import { favoriteFromEntry } from "@/domain/favorites";
import {
  createPiggy,
  justReachedGoal,
  markDone,
  moveBalance,
  removeTxn,
  reopen,
  restoreTxn,
  runAutoStash,
  spendFrom,
  stashInto,
  updatePiggy,
  type PiggyDraft,
} from "@/domain/piggy-actions";
import type {
  AppState,
  Bucket,
  Entry,
  ID,
  ISODate,
  Month,
  MonthKey,
  Piggy,
  PiggyTxn,
  RecurringRule,
} from "@/domain/types";
import { newId } from "@/lib/id";
import { appStore } from "./index";

function updateMonth(data: AppState, key: MonthKey, change: (m: Month) => Month): AppState {
  const month = data.months[key];
  if (month === undefined) return data;
  const next = change(month);
  return next === month ? data : { ...data, months: { ...data.months, [key]: next } };
}

export function setProfileName(name: string): void {
  const trimmed = name.trim();
  appStore.getState().update((d) => ({
    ...d,
    profile: trimmed === "" ? {} : { name: trimmed },
  }));
}

/** "Start November": saves the month and makes it the active one. */
export function startMonth(key: MonthKey, plan: MonthPlan, now = new Date()): StartMonthResult {
  const result = startMonthRule(key, plan, toISODate(now));
  if (result.ok) {
    appStore.getState().update((d) => ({
      ...d,
      activeMonthKey: key,
      months: { ...d.months, [key]: result.month },
    }));
  }
  return result;
}

export function saveBucket(key: MonthKey, bucket: Bucket): void {
  appStore.getState().update((d) => updateMonth(d, key, (m) => updateBucketRule(m, bucket)));
}

export function deleteBucket(key: MonthKey, bucketId: ID): void {
  appStore.getState().update((d) => updateMonth(d, key, (m) => deleteBucketRule(m, bucketId)));
}

/** Moves a bucket's entries to another bucket, then deletes it (PRD §13). */
export function moveEntriesAndDelete(key: MonthKey, fromId: ID, toId: ID, now = new Date()): void {
  appStore
    .getState()
    .update((d) =>
      updateMonth(d, key, (m) =>
        deleteBucketRule(moveEntries(m, fromId, toId, toISODate(now)), fromId),
      ),
    );
}

// ── Entries (PRD §8.4, §8.5) ──────────────────────────────────────────────

function activeKey(): MonthKey | null {
  return appStore.getState().data.activeMonthKey;
}

/** Logs an entry in the active month. Returns any heads-up that just became due. */
export function logEntry(entry: Entry): HeadsUpToast | null {
  const key = activeKey();
  if (key === null) return null;
  let headsUp: HeadsUpToast | null = null;
  appStore.getState().update((d) =>
    updateMonth(d, key, (m) => {
      const result = addEntry(m, entry);
      headsUp = result.headsUp;
      return result.month;
    }),
  );
  return headsUp;
}

export function editEntry(entry: Entry, now = new Date()): HeadsUpToast | null {
  const key = activeKey();
  if (key === null) return null;
  let headsUp: HeadsUpToast | null = null;
  appStore.getState().update((d) =>
    updateMonth(d, key, (m) => {
      const result = replaceEntry(m, entry, toISODate(now));
      headsUp = result.headsUp;
      return result.month;
    }),
  );
  return headsUp;
}

/** Deletes an entry and returns it, so it can be put back with Undo. */
export function deleteEntry(id: ID): Entry | null {
  const key = activeKey();
  if (key === null) return null;
  let removed: Entry | null = null;
  appStore.getState().update((d) =>
    updateMonth(d, key, (m) => {
      const result = removeEntry(m, id);
      removed = result.removed;
      return result.month;
    }),
  );
  return removed;
}

/** Undo for a delete or an edit: the entry goes back exactly as it was. */
export function putBackEntry(entry: Entry): void {
  const key = activeKey();
  if (key === null) return;
  appStore.getState().update((d) => updateMonth(d, key, (m) => restoreEntry(m, entry)));
}

// ── Favorites (PRD §8.4) ─────────────────────────────────────────────────

export function addFavorite(
  entry: Pick<Entry, "note" | "amount" | "bucketId">,
  emoji?: string,
): void {
  appStore.getState().update((d) => ({
    ...d,
    favorites: [
      ...d.favorites,
      favoriteFromEntry(
        entry,
        emoji,
        newId(),
        Math.max(-1, ...d.favorites.map((f) => f.order)) + 1,
      ),
    ],
  }));
}

/** "Save as favorite?" is asked once per note, amount and bucket. */
export function rememberFavoriteAsked(key: string): void {
  appStore.getState().update((d) =>
    d.meta.dismissedFavoriteSuggestions.includes(key)
      ? d
      : {
          ...d,
          meta: {
            ...d.meta,
            dismissedFavoriteSuggestions: [...d.meta.dismissedFavoriteSuggestions, key],
          },
        },
  );
}

/** "Continue in browser" on the install guide (PRD §8.1). */
export function dismissInstallGuide(): void {
  appStore.getState().update((d) => ({ ...d, meta: { ...d.meta, installGuideDismissed: true } }));
}

/** "Edit budget" on Home: the month's total can change after it starts. */
export function setMonthBudget(key: MonthKey, totalBudget: Paise): void {
  appStore.getState().update((d) => updateMonth(d, key, (m) => updateTotalBudget(m, totalBudget)));
}

// ── Piggy banks (PRD §8.6) ───────────────────────────────────────────────

function updatePiggyById(id: ID, change: (p: Piggy) => Piggy): void {
  appStore.getState().update((d) => ({
    ...d,
    piggies: d.piggies.map((p) => (p.id === id ? change(p) : p)),
  }));
}

function piggyById(id: ID): Piggy | undefined {
  return appStore.getState().data.piggies.find((p) => p.id === id);
}

export function addPiggy(draft: PiggyDraft, opening: Paise, now = new Date()): Piggy {
  const piggy = createPiggy(draft, opening, { piggy: newId(), opening: newId() }, now);
  appStore.getState().update((d) => ({ ...d, piggies: [...d.piggies, piggy] }));
  return piggy;
}

export function savePiggy(id: ID, draft: PiggyDraft): void {
  updatePiggyById(id, (p) => updatePiggy(p, draft));
}

export interface PiggyChange {
  txnId: ID;
  /** True the first time this change reached the goal. */
  reachedGoal: boolean;
}

/** A stash into a piggy, counted in this month (PRD §8.6). */
export function stash(id: ID, amount: Paise, now = new Date()): PiggyChange | null {
  const before = piggyById(id);
  if (!before) return null;
  const txnId = newId();
  const after = stashInto(before, amount, txnId, now);
  updatePiggyById(id, () => after);
  return { txnId, reachedGoal: justReachedGoal(before, after) };
}

/** Spending from a piggy: only the piggy goes down (PRD §7.4). */
export function spendFromPiggy(id: ID, amount: Paise, date: ISODate, note?: string): ID | null {
  const piggy = piggyById(id);
  if (!piggy) return null;
  const txnId = newId();
  updatePiggyById(id, (p) => spendFrom(p, amount, txnId, date, note));
  return txnId;
}

/** Deletes a stash or spend; returns it for Undo. */
export function deletePiggyTxn(piggyId: ID, txnId: ID): PiggyTxn | null {
  const piggy = piggyById(piggyId);
  if (!piggy) return null;
  const { piggy: next, removed } = removeTxn(piggy, txnId);
  updatePiggyById(piggyId, () => next);
  return removed;
}

export function putBackPiggyTxn(piggyId: ID, t: PiggyTxn): void {
  updatePiggyById(piggyId, (p) => restoreTxn(p, t));
}

export function markPiggyDone(id: ID, now = new Date()): void {
  updatePiggyById(id, (p) => markDone(p, now));
}

export function reopenPiggy(id: ID): void {
  updatePiggyById(id, reopen);
}

/** "Move what's left" from a finished piggy into another one. */
export function movePiggyBalance(fromId: ID, toId: ID, now = new Date()): void {
  const from = piggyById(fromId);
  const to = piggyById(toId);
  if (!from || !to) return;
  const moved = moveBalance(from, to, { out: newId(), in: newId() }, now);
  updatePiggyById(fromId, () => moved.from);
  updatePiggyById(toId, () => moved.to);
}

/** Runs on launch and when a month starts: auto-stash, once per piggy per month. */
export function autoStashNow(now = new Date()): number {
  const { data } = appStore.getState();
  const month = data.activeMonthKey === null ? undefined : data.months[data.activeMonthKey];
  if (!month) return 0;
  const result = runAutoStash(data.piggies, month, now);
  if (result.stashed > 0) appStore.getState().update((d) => ({ ...d, piggies: result.piggies }));
  return result.stashed;
}

// ── Month end (PRD §8.8) ─────────────────────────────────────────────────

/**
 * Checks the calendar against the active month and closes it once the month is over.
 * Months the app was never opened in are skipped. A clock going backwards changes nothing.
 */
export function checkTheMonth(now = new Date()): MonthCheck {
  const { data } = appStore.getState();
  const result = checkMonth(data.activeMonthKey, now);
  if (result.kind === "rollover") {
    appStore.getState().update((d) => updateMonth(d, result.closing, (m) => closeMonth(m, now)));
  }
  return result;
}

/** The end of the recap: the closed month remembers it was seen, then setup opens. */
export function finishRecap(key: MonthKey, now = new Date()): void {
  appStore.getState().update((d) => updateMonth(d, key, (m) => markRecapSeen(m, now)));
}

/** "Stash some into a piggy?" after a month closes (PRD §8.6). */
export function moveLeftoverToPiggy(
  fromKey: MonthKey,
  piggyId: ID,
  amount: Paise,
  now = new Date(),
): boolean {
  const { data } = appStore.getState();
  const month = data.months[fromKey];
  const piggy = data.piggies.find((p) => p.id === piggyId);
  if (!month || !piggy) return false;
  const moved = moveLeftover(month, data.piggies, piggy, amount, newId(), now);
  if (moved === null) return false;
  updatePiggyById(piggyId, () => moved);
  return true;
}

/** Only after the share sheet completes (PRD §8.11). */
export function backupDone(now = new Date()): void {
  appStore.getState().update((d) => recordBackup(d, now));
}

// ── Recurring (PRD §8.7) ─────────────────────────────────────────────────

function activeMonthNow(now: Date): Month | null {
  const { data } = appStore.getState();
  const month = data.activeMonthKey === null ? undefined : data.months[data.activeMonthKey];
  return month && month.status === "active" && month.key === monthKeyOfDate(now) ? month : null;
}

/** Logs every due "Log automatically" rule, once. Returns what was logged. */
export function runRecurringNow(now = new Date()): RecurringRule[] {
  const month = activeMonthNow(now);
  if (month === null) return [];
  const rules = appStore.getState().data.recurring;
  const today = dayInMonth(month.key, now);
  const due = rules.filter((r) => r.mode === "auto" && recurringState(r, month, today) === "due");
  if (due.length === 0) return [];
  appStore
    .getState()
    .update((d) =>
      updateMonth(d, month.key, (m) =>
        runAutoRecurring(m, d.recurring, today, newId, toISODate(now)),
      ),
    );
  return due;
}

/** "Log" on a Due now item. */
export function logRule(ruleId: ID, now = new Date()): void {
  const month = activeMonthNow(now);
  const rule = appStore.getState().data.recurring.find((r) => r.id === ruleId);
  if (month === null || !rule) return;
  appStore
    .getState()
    .update((d) => updateMonth(d, month.key, (m) => logRecurring(m, rule, newId, toISODate(now))));
}

/** "Skip": stays skipped for the rest of the month. */
export function skipRule(ruleId: ID, now = new Date()): void {
  const month = activeMonthNow(now);
  if (month === null) return;
  appStore.getState().update((d) => updateMonth(d, month.key, (m) => skipRecurring(m, ruleId)));
}

export function addRule(draft: RuleDraft, now = new Date()): RecurringRule {
  const rule = createRule(draft, newId(), toISODate(now));
  appStore.getState().update((d) => ({ ...d, recurring: [...d.recurring, rule] }));
  return rule;
}

export function saveRule(id: ID, draft: RuleDraft): void {
  appStore.getState().update((d) => ({
    ...d,
    recurring: d.recurring.map((r) => (r.id === id ? updateRule(r, draft) : r)),
  }));
}

/** Deletes a rule; entries it logged stay. Returns it for Undo. */
export function deleteRule(id: ID): RecurringRule | null {
  const rule = appStore.getState().data.recurring.find((r) => r.id === id) ?? null;
  appStore.getState().update((d) => ({ ...d, recurring: d.recurring.filter((r) => r.id !== id) }));
  return rule;
}

export function putBackRule(rule: RecurringRule): void {
  appStore.getState().update((d) => ({
    ...d,
    recurring: [...d.recurring.filter((r) => r.id !== rule.id), rule],
  }));
}

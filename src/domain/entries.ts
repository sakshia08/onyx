/**
 * Logging, editing and deleting entries (PRD §8.4, §8.5). Pure functions that return a new
 * month. Closed months are read-only: every change to one is ignored.
 */

import { bucketUsed, headsUpFor } from "./budget";
import { dayInMonth, isoForDay, monthKeyOf } from "./dates";
import type { AlertThreshold, Entry, ID, ISODate, Month, MonthKey } from "./types";

export interface HeadsUpToast {
  bucketId: ID;
  threshold: AlertThreshold;
}

export interface LogResult {
  month: Month;
  /** A bucket that just crossed 80% or 100% for the first time this month. */
  headsUp: HeadsUpToast | null;
}

/** After a change to a bucket: record and return any heads-up that just became due. */
function withHeadsUp(month: Month, bucketId: ID): LogResult {
  const bucket = month.buckets.find((b) => b.id === bucketId);
  if (bucket === undefined) return { month, headsUp: null };
  const result = headsUpFor(bucket, bucketUsed(month.entries, bucketId), month.alertsShown);
  if (result.show === null) return { month, headsUp: null };
  return {
    month: { ...month, alertsShown: [...month.alertsShown, ...result.record] },
    headsUp: { bucketId, threshold: result.show },
  };
}

function canChange(month: Month, entry: Pick<Entry, "date" | "bucketId">): boolean {
  return (
    month.status === "active" &&
    monthKeyOf(entry.date) === month.key &&
    month.buckets.some((b) => b.id === entry.bucketId)
  );
}

/** Logs a new entry. Ignored for a closed month, another month's date or an unknown bucket. */
export function addEntry(month: Month, entry: Entry): LogResult {
  if (!canChange(month, entry) || month.entries.some((e) => e.id === entry.id)) {
    return { month, headsUp: null };
  }
  return withHeadsUp({ ...month, entries: [...month.entries, entry] }, entry.bucketId);
}

/** Saves an edited entry (same id). */
export function replaceEntry(month: Month, entry: Entry, now: ISODate): LogResult {
  if (!canChange(month, entry) || !month.entries.some((e) => e.id === entry.id)) {
    return { month, headsUp: null };
  }
  const edited = { ...entry, updatedAt: now };
  return withHeadsUp(
    { ...month, entries: month.entries.map((e) => (e.id === entry.id ? edited : e)) },
    entry.bucketId,
  );
}

/** Deletes an entry. Keep the returned entry to undo. */
export function removeEntry(month: Month, id: ID): { month: Month; removed: Entry | null } {
  const removed = month.entries.find((e) => e.id === id) ?? null;
  if (month.status !== "active" || removed === null) return { month, removed: null };
  return { month: { ...month, entries: month.entries.filter((e) => e.id !== id) }, removed };
}

/**
 * Undo: puts an entry back exactly as it was, replacing any edited version.
 * Heads-ups already shown stay shown.
 */
export function restoreEntry(month: Month, entry: Entry): Month {
  if (!canChange(month, entry)) return month;
  const others = month.entries.filter((e) => e.id !== entry.id);
  return { ...month, entries: [...others, entry] };
}

/** Days that can be picked for an entry: the 1st of the month through today (PRD §8.4). */
export function selectableDays(key: MonthKey, now: Date): number[] {
  return Array.from({ length: dayInMonth(key, now) }, (_, i) => i + 1);
}

/**
 * The date-time for an entry on a chosen day. New entries keep the current time
 * (PROGRESS decision b); edits keep the entry's own time.
 */
export function dateForDay(key: MonthKey, day: number, time: Date | ISODate): ISODate {
  if (typeof time === "string") {
    const [h, m] = time.slice(11, 16).split(":").map(Number) as [number, number];
    return withSeconds(isoForDay(key, day, h, m), time.slice(17, 19));
  }
  return withSeconds(
    isoForDay(key, day, time.getHours(), time.getMinutes()),
    String(time.getSeconds()).padStart(2, "0"),
  );
}

function withSeconds(iso: ISODate, seconds: string): ISODate {
  return `${iso.slice(0, 17)}${seconds}`;
}

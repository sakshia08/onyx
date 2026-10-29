/**
 * Insights and search (PRD §8.9). Integer paise only; nothing here is stored.
 */

import { format, getDay } from "date-fns";
import { bucketUsed } from "./budget";
import { addMonthsToKey, compareMonthKeys, daysInMonth, fromISODate, isoForDay } from "./dates";
import { sumPaise, type Paise } from "./money";
import { percentChange } from "./recap";
import { stashedThisMonth } from "./totals";
import type { Bucket, DayKey, Entry, EntryType, ID, Month, MonthKey, Piggy } from "./types";

/** The month switcher: every month, newest first. */
export function monthsNewestFirst(months: Readonly<Record<MonthKey, Month>>): Month[] {
  return Object.values(months).sort((a, b) => compareMonthKeys(b.key, a.key));
}

/** What a day cost from spend buckets: expenses − money back (save buckets aren't spending). */
export function spendOnDay(month: Month, day: number): Paise {
  const spend = new Set(month.buckets.filter((b) => b.kind === "spend").map((b) => b.id));
  const prefix = isoForDay(month.key, day).slice(0, 10);
  return sumPaise(
    month.entries
      .filter((e) => spend.has(e.bucketId) && e.date.startsWith(prefix))
      .map((e) => (e.type === "expense" ? e.amount : -e.amount)),
  );
}

export interface Bar {
  /** Day of the month, or null for a day outside this month (shown empty). */
  day: number | null;
  label: string;
  /** Long label for VoiceOver and the value tag, e.g. "Mon 16 Nov". */
  name: string;
  value: Paise;
}

/** Month view: one bar per day. */
export function monthBars(month: Month): Bar[] {
  return Array.from({ length: daysInMonth(month.key) }, (_, i) => {
    const day = i + 1;
    return {
      day,
      label: String(day),
      name: format(fromISODate(isoForDay(month.key, day)), "EEE d MMM"),
      value: spendOnDay(month, day),
    };
  });
}

/** Monday-first weekday of a day in the month: 0 = Monday … 6 = Sunday. */
function weekday(key: MonthKey, day: number): number {
  return (getDay(fromISODate(isoForDay(key, day))) + 6) % 7;
}

/** The weeks that touch a month, each as the day number of its Monday (can be ≤ 0). */
export function weekStarts(key: MonthKey): number[] {
  const first = 1 - weekday(key, 1);
  const starts: number[] = [];
  for (let monday = first; monday <= daysInMonth(key); monday += 7) starts.push(monday);
  return starts;
}

/** The week to show first: the one with `today` in it, or the month's last week. */
export function defaultWeek(key: MonthKey, today: number | null): number {
  const starts = weekStarts(key);
  const day = today ?? daysInMonth(key);
  return starts.filter((s) => s <= day).at(-1) ?? starts[0] ?? 1;
}

const WEEKDAYS = ["M", "T", "W", "T", "F", "S", "S"];

/** Week view: Mon–Sun from `monday`. Days outside the month are empty (decision c). */
export function weekBars(month: Month, monday: number): Bar[] {
  const days = daysInMonth(month.key);
  return WEEKDAYS.map((label, i) => {
    const day = monday + i;
    const inMonth = day >= 1 && day <= days;
    return {
      day: inMonth ? day : null,
      label,
      name: inMonth ? format(fromISODate(isoForDay(month.key, day)), "EEE d MMM") : "Another month",
      value: inMonth ? spendOnDay(month, day) : 0,
    };
  });
}

/** "16–22 Nov", clipped to the month. */
export function weekLabel(key: MonthKey, monday: number): string {
  const from = Math.max(1, monday);
  const to = Math.min(daysInMonth(key), monday + 6);
  const mon = format(fromISODate(isoForDay(key, 1)), "MMM");
  return `${String(from)}–${String(to)} ${mon}`;
}

export interface BucketTile {
  bucket: Bucket;
  used: Paise;
  /** vs the previous month; null when there's no previous month. */
  change: number | "new" | null;
}

/** Bucket tiles: used this month, and the change vs the previous month. */
export function bucketTiles(month: Month, months: Readonly<Record<MonthKey, Month>>): BucketTile[] {
  const previous = months[addMonthsToKey(month.key, -1)];
  return [...month.buckets]
    .sort((a, b) => (a.kind === b.kind ? a.order - b.order : a.kind === "spend" ? -1 : 1))
    .map((bucket) => {
      const used = bucketUsed(month.entries, bucket.id);
      const had = previous?.buckets.some((b) => b.id === bucket.id) ?? false;
      return {
        bucket,
        used,
        change:
          previous === undefined
            ? null
            : had
              ? percentChange(used, bucketUsed(previous.entries, bucket.id))
              : "new",
      };
    });
}

/** "Saved this month": save buckets plus piggy stashes. */
export function savedThisMonth(
  month: Month,
  piggies: readonly Piggy[],
): { buckets: Paise; piggies: Paise; total: Paise } {
  const buckets = sumPaise(
    month.buckets.filter((b) => b.kind === "save").map((b) => bucketUsed(month.entries, b.id)),
  );
  const stashed = stashedThisMonth(piggies, month.key);
  return { buckets, piggies: stashed, total: buckets + stashed };
}

// ── Search (PRD §8.9) ────────────────────────────────────────────────────

export interface SearchFilters {
  query: string;
  bucketId?: ID;
  /** Months to search, both included. */
  from?: MonthKey;
  to?: MonthKey;
  type?: EntryType;
}

export interface SearchResults {
  count: number;
  /** Expenses minus money back, across the results. */
  total: Paise;
  months: { month: Month; entries: Entry[]; total: Paise }[];
}

const net = (entries: readonly Entry[]) =>
  sumPaise(entries.map((e) => (e.type === "expense" ? e.amount : -e.amount)));

/** Notes across all months, case-insensitive, matching any part (PRD §8.9). */
export function searchEntries(
  months: Readonly<Record<MonthKey, Month>>,
  filters: SearchFilters,
): SearchResults {
  const q = filters.query.trim().toLowerCase();
  const groups = monthsNewestFirst(months)
    .filter(
      (m) =>
        (filters.from === undefined || m.key >= filters.from) &&
        (filters.to === undefined || m.key <= filters.to),
    )
    .map((month) => {
      const entries = month.entries
        .filter((e) => q === "" || (e.note ?? "").toLowerCase().includes(q))
        .filter((e) => filters.bucketId === undefined || e.bucketId === filters.bucketId)
        .filter((e) => filters.type === undefined || e.type === filters.type)
        .sort((a, b) => (a.date < b.date ? 1 : -1));
      return { month, entries, total: net(entries) };
    })
    .filter((g) => g.entries.length > 0);
  const all = groups.flatMap((g) => g.entries);
  return { count: all.length, total: net(all), months: groups };
}

/** Every bucket ever used, by id, with its most recent name (for the search filter). */
export function allBuckets(months: Readonly<Record<MonthKey, Month>>): Bucket[] {
  const byId = new Map<ID, Bucket>();
  for (const m of [...monthsNewestFirst(months)].reverse())
    for (const b of m.buckets) byId.set(b.id, b);
  return [...byId.values()].sort((a, b) => a.order - b.order);
}

/** For "Mon 16 Nov"-style labels on a day key. */
export function shortDay(day: DayKey): string {
  return format(fromISODate(day), "EEE d MMM");
}

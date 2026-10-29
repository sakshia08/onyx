/**
 * Lists of entries (PRD §8.5): newest first, grouped by day with a total for each day.
 */

import { format } from "date-fns";
import { dayKeyOf, daysBetween, fromISODate, monthKeyOf } from "./dates";
import { sumPaise, type Paise } from "./money";
import type { DayKey, Entry, MonthKey, Piggy, PiggyTxn } from "./types";

export interface DayGroup {
  day: DayKey;
  /** "Today", "Yesterday" or "Mon 16 Nov". */
  label: string;
  /** What the day cost: expenses minus money back. Can be negative. */
  total: Paise;
  entries: Entry[];
}

export function dayLabel(day: DayKey, today: DayKey): string {
  const ago = daysBetween(day, today);
  if (ago === 0) return "Today";
  if (ago === 1) return "Yesterday";
  return format(fromISODate(day), "EEE d MMM");
}

/** Newest first: by date, then by when it was logged. */
export function newestFirst(entries: readonly Entry[]): Entry[] {
  return [...entries].sort((a, b) =>
    a.date !== b.date ? (a.date < b.date ? 1 : -1) : a.createdAt < b.createdAt ? 1 : -1,
  );
}

export function groupEntriesByDay(entries: readonly Entry[], today: DayKey): DayGroup[] {
  const groups: DayGroup[] = [];
  for (const entry of newestFirst(entries)) {
    const day = dayKeyOf(entry.date);
    let group = groups.at(-1);
    if (group?.day !== day) {
      group = { day, label: dayLabel(day, today), total: 0, entries: [] };
      groups.push(group);
    }
    group.entries.push(entry);
  }
  return groups.map((g) => ({
    ...g,
    total: sumPaise(g.entries.map((e) => (e.type === "expense" ? e.amount : -e.amount))),
  }));
}

/** The last few entries for Home's "Recent". */
export function recentEntries(entries: readonly Entry[], count = 5): Entry[] {
  return newestFirst(entries).slice(0, count);
}

/** The time an entry was logged for, "13:42". */
export function entryTime(entry: Pick<Entry, "date">): string {
  return entry.date.slice(11, 16);
}

// ── Activity with piggies (PRD §8.5) ──────────────────────────────────────

export type ActivityItem =
  | { kind: "entry"; entry: Entry; date: string; createdAt: string }
  | { kind: "piggy"; piggy: Piggy; txn: PiggyTxn; date: string; createdAt: string };

export interface ActivityDay {
  day: DayKey;
  label: string;
  /** What the day took from the month: expenses − money back + stashes. Piggy spends don't count. */
  total: Paise;
  items: ActivityItem[];
}

/** Everything this month: entries, plus stashes into and spends from piggies. */
export function monthActivity(
  entries: readonly Entry[],
  piggies: readonly Piggy[],
  key: MonthKey,
): ActivityItem[] {
  const piggyItems: ActivityItem[] = piggies.flatMap((piggy) =>
    piggy.transactions
      .filter((t) => (t.type === "stash" || t.type === "spend") && monthKeyOf(t.date) === key)
      .map((txn) => ({
        kind: "piggy" as const,
        piggy,
        txn,
        date: txn.date,
        createdAt: txn.createdAt,
      })),
  );
  const entryItems: ActivityItem[] = entries.map((entry) => ({
    kind: "entry",
    entry,
    date: entry.date,
    createdAt: entry.createdAt,
  }));
  return [...entryItems, ...piggyItems];
}

function monthEffect(item: ActivityItem): Paise {
  if (item.kind === "entry")
    return item.entry.type === "expense" ? item.entry.amount : -item.entry.amount;
  return item.txn.type === "stash" ? item.txn.amount : 0;
}

export function groupActivityByDay(items: readonly ActivityItem[], today: DayKey): ActivityDay[] {
  const sorted = [...items].sort((a, b) =>
    a.date !== b.date ? (a.date < b.date ? 1 : -1) : a.createdAt < b.createdAt ? 1 : -1,
  );
  const days: ActivityDay[] = [];
  for (const item of sorted) {
    const day = dayKeyOf(item.date);
    let group = days.at(-1);
    if (group?.day !== day) {
      group = { day, label: dayLabel(day, today), total: 0, items: [] };
      days.push(group);
    }
    group.items.push(item);
  }
  return days.map((d) => ({ ...d, total: sumPaise(d.items.map(monthEffect)) }));
}

/**
 * Lists of entries (PRD §8.5): newest first, grouped by day with a total for each day.
 */

import { format } from "date-fns";
import { dayKeyOf, daysBetween, fromISODate } from "./dates";
import { sumPaise, type Paise } from "./money";
import type { DayKey, Entry } from "./types";

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

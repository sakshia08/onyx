/**
 * Note suggestions and favorite suggestions for Quick add (PRD §8.4).
 * Computed from entries, never stored.
 */

import { daysBetween, dayKeyOf } from "./dates";
import type { Paise } from "./money";
import type { DayKey, Entry, Favorite, ID } from "./types";

const MAX_SUGGESTIONS = 3;

function normalize(note: string): string {
  return note.trim().toLowerCase();
}

interface NoteStats {
  note: string;
  count: number;
  lastDate: string;
  prefix: boolean;
}

/** Groups notes case-insensitively, keeping the most recent spelling. */
function noteStats(entries: readonly Entry[], query: string): NoteStats[] {
  const q = normalize(query);
  const byKey = new Map<string, NoteStats>();
  for (const e of entries) {
    if (e.note === undefined || e.note.trim() === "") continue;
    const key = normalize(e.note);
    if (q !== "" && !key.includes(q)) continue;
    const existing = byKey.get(key);
    if (existing === undefined) {
      byKey.set(key, {
        note: e.note.trim(),
        count: 1,
        lastDate: e.date,
        prefix: key.startsWith(q),
      });
    } else {
      existing.count += 1;
      if (e.date > existing.lastDate) {
        existing.lastDate = e.date;
        existing.note = e.note.trim();
      }
    }
  }
  return [...byKey.values()];
}

function rank(a: NoteStats, b: NoteStats): number {
  if (a.prefix !== b.prefix) return a.prefix ? -1 : 1;
  if (a.count !== b.count) return b.count - a.count;
  return a.lastDate < b.lastDate ? 1 : a.lastDate > b.lastDate ? -1 : 0;
}

/**
 * Up to 3 note suggestions. While typing: matches anywhere, prefix matches first, then by how
 * often, then how recently. With the note empty and a bucket chosen: that bucket's most common notes.
 */
export function noteSuggestions(entries: readonly Entry[], query: string, bucketId?: ID): string[] {
  const q = normalize(query);
  if (q === "" && bucketId === undefined) return [];
  const pool = q === "" ? entries.filter((e) => e.bucketId === bucketId) : entries;
  return noteStats(pool, q)
    .filter((s) => normalize(s.note) !== q)
    .sort(rank)
    .slice(0, MAX_SUGGESTIONS)
    .map((s) => s.note);
}

/** The bucket a note is most often logged in (ties: the most recent). */
export function bucketForNote(entries: readonly Entry[], note: string): ID | null {
  const key = normalize(note);
  const counts = new Map<ID, { count: number; lastDate: string }>();
  for (const e of entries) {
    if (e.note === undefined || normalize(e.note) !== key) continue;
    const c = counts.get(e.bucketId) ?? { count: 0, lastDate: "" };
    counts.set(e.bucketId, {
      count: c.count + 1,
      lastDate: e.date > c.lastDate ? e.date : c.lastDate,
    });
  }
  let best: { id: ID; count: number; lastDate: string } | null = null;
  for (const [id, c] of counts) {
    if (
      best === null ||
      c.count > best.count ||
      (c.count === best.count && c.lastDate > best.lastDate)
    ) {
      best = { id, ...c };
    }
  }
  return best?.id ?? null;
}

/** "note|amount|bucketId", the key stored when a favorite suggestion is dismissed. */
export function favoriteKey(note: string, amount: Paise, bucketId: ID): string {
  return `${normalize(note)}|${String(amount)}|${bucketId}`;
}

const FAVORITE_REPEATS = 3;
const FAVORITE_WINDOW_DAYS = 30;

/**
 * "Save as favorite?": after the same note, amount and bucket are logged 3 times within
 * 30 days. Asked once; never again once dismissed, or if it's already a favorite.
 */
export function shouldSuggestFavorite(
  entries: readonly Entry[],
  latest: Pick<Entry, "note" | "amount" | "bucketId" | "type">,
  today: DayKey,
  favorites: readonly Favorite[],
  dismissed: readonly string[],
): boolean {
  if (latest.type !== "expense" || latest.note === undefined || latest.note.trim() === "") {
    return false;
  }
  const key = favoriteKey(latest.note, latest.amount, latest.bucketId);
  if (dismissed.includes(key)) return false;
  const alreadyFavorite = favorites.some((f) => favoriteKey(f.label, f.amount, f.bucketId) === key);
  if (alreadyFavorite) return false;
  const repeats = entries.filter(
    (e) =>
      e.type === "expense" &&
      e.note !== undefined &&
      favoriteKey(e.note, e.amount, e.bucketId) === key &&
      daysBetween(dayKeyOf(e.date), today) < FAVORITE_WINDOW_DAYS &&
      daysBetween(dayKeyOf(e.date), today) >= 0,
  ).length;
  return repeats >= FAVORITE_REPEATS;
}

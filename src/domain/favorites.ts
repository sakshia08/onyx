/**
 * Favorites (PRD §8.4): saved one-tap entries, e.g. "Metro ₹40 → Commute".
 */

import type { Entry, Favorite, ID, ISODate, Month } from "./types";

/** A favorite made from a logged entry (from "Save as favorite?"). */
export function favoriteFromEntry(
  entry: Pick<Entry, "note" | "amount" | "bucketId">,
  emoji: string | undefined,
  id: ID,
  order: number,
): Favorite {
  return {
    id,
    label: entry.note?.trim() ?? "",
    ...(emoji !== undefined ? { emoji } : {}),
    amount: entry.amount,
    bucketId: entry.bucketId,
    order,
  };
}

/** The entry a favorite logs: today, now, with its label as the note. */
export function entryFromFavorite(favorite: Favorite, id: ID, now: ISODate): Entry {
  return {
    id,
    type: "expense",
    bucketId: favorite.bucketId,
    amount: favorite.amount,
    note: favorite.label,
    date: now,
    createdAt: now,
    source: "favorite",
  };
}

/** Favorites that can be used this month (their bucket still exists), in order. */
export function usableFavorites(favorites: readonly Favorite[], month: Month): Favorite[] {
  return favorites
    .filter((f) => month.buckets.some((b) => b.id === f.bucketId))
    .sort((a, b) => a.order - b.order);
}

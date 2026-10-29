/**
 * Every change to saved data goes through here, built from the pure rules in src/domain.
 */

import { toISODate } from "@/domain/dates";
import {
  deleteBucket as deleteBucketRule,
  moveEntries,
  startMonth as startMonthRule,
  updateBucket as updateBucketRule,
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
import type { AppState, Bucket, Entry, ID, Month, MonthKey } from "@/domain/types";
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

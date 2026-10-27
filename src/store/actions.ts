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
import type { AppState, Bucket, ID, Month, MonthKey } from "@/domain/types";
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

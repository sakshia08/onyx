/**
 * Bucket and month calculations (PRD §7.2–7.3). Integer paise only.
 * Ratios (used / allocated) are compared with cross-multiplication, so no float rounding.
 */

import type { Paise } from "./money";

export type BucketKind = "spend" | "save";

export function bucketRemaining(allocated: Paise, used: Paise): Paise {
  return allocated - used;
}

/**
 * Ahead of pace (PRD §7.2): used / allocated > today / daysInMonth + 0.15, while remaining > 0.
 * Rewritten as 100·used·days > allocated·(100·today + 15·days) to stay in whole numbers.
 */
export function isAheadOfPace(
  allocated: Paise,
  used: Paise,
  today: number,
  daysInMonth: number,
): boolean {
  if (allocated <= 0) return false;
  if (allocated - used <= 0) return false;
  return 100 * used * daysInMonth > allocated * (100 * today + 15 * daysInMonth);
}

/** used / allocated for visuals only (progress bars). Not used for money. */
export function usedFraction(allocated: Paise, used: Paise): number {
  if (allocated <= 0) return used > 0 ? 1 : 0;
  return Math.max(0, used / allocated);
}

export type BucketStatus =
  | { kind: "spend"; state: "ok" | "ahead" | "over"; remaining: Paise }
  | { kind: "save"; state: "left" | "done" | "extra"; remaining: Paise };

export function bucketStatus(
  kind: BucketKind,
  allocated: Paise,
  used: Paise,
  today: number,
  daysInMonth: number,
): BucketStatus {
  const remaining = bucketRemaining(allocated, used);
  if (kind === "save") {
    const state = remaining > 0 ? "left" : remaining === 0 ? "done" : "extra";
    return { kind, state, remaining };
  }
  if (remaining < 0) return { kind, state: "over", remaining };
  return {
    kind,
    state: isAheadOfPace(allocated, used, today, daysInMonth) ? "ahead" : "ok",
    remaining,
  };
}

/**
 * Bucket and month calculations (PRD §7.2–7.3). Integer paise only.
 * Ratios (used / allocated) are compared with cross-multiplication, so no float rounding.
 */

import { sumPaise, type Paise } from "./money";
import type { AlertShown, AlertThreshold, Bucket, Entry } from "./types";

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

/** used = expenses − money back, for one bucket (PRD §7.2). */
export function bucketUsed(entries: readonly Entry[], bucketId: string): Paise {
  return sumPaise(
    entries
      .filter((e) => e.bucketId === bucketId)
      .map((e) => (e.type === "expense" ? e.amount : -e.amount)),
  );
}

export interface HeadsUp {
  /** The toast to show now: the highest threshold newly reached, or null. */
  show: AlertThreshold | null;
  /** Thresholds to record in `alertsShown`, so each fires once per bucket per month. */
  record: AlertShown[];
}

const THRESHOLDS: readonly AlertThreshold[] = [80, 100];

/**
 * Heads-up toasts for spend buckets (PRD §7.2): at 80% and 100% used, once each per month.
 * A ₹0 bucket fires the 100% heads-up on its first expense (PROGRESS decision a).
 */
export function headsUpFor(
  bucket: Pick<Bucket, "id" | "kind" | "allocated">,
  used: Paise,
  alertsShown: readonly AlertShown[],
): HeadsUp {
  if (bucket.kind !== "spend") return { show: null, record: [] };
  const reached = THRESHOLDS.filter((t) =>
    bucket.allocated <= 0 ? t === 100 && used > 0 : used * 100 >= t * bucket.allocated,
  );
  const fresh = reached.filter(
    (t) => !alertsShown.some((a) => a.bucketId === bucket.id && a.threshold === t),
  );
  return {
    show: fresh.at(-1) ?? null,
    record: fresh.map((threshold) => ({ bucketId: bucket.id, threshold })),
  };
}

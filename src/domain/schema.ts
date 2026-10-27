/**
 * The saved data's shape, checked with zod when loading and when restoring a backup
 * (PRD §8.11). Must match types.ts exactly; the test makes sure it does.
 */

import { z } from "zod";
import { BUCKET_COLORS } from "./bucket-colors";
import type { AppState } from "./types";

const paise = z.int();
const positivePaise = z.int().positive();
const id = z.string().min(1);
const monthKey = z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/);
const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/);
const dayKey = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

const bucket = z.object({
  id,
  name: z.string(),
  emoji: z.string(),
  color: z.enum(BUCKET_COLORS),
  kind: z.enum(["spend", "save"]),
  allocated: paise.nonnegative(),
  order: z.int(),
});

const entry = z.object({
  id,
  type: z.enum(["expense", "refund"]),
  bucketId: id,
  amount: positivePaise,
  note: z.string().exactOptional(),
  date: isoDate,
  createdAt: isoDate,
  updatedAt: isoDate.exactOptional(),
  source: z.enum(["manual", "favorite", "recurring"]),
  recurringRuleId: id.exactOptional(),
});

const month = z.object({
  key: monthKey,
  status: z.enum(["active", "closed"]),
  totalBudget: paise.nonnegative(),
  buckets: z.array(bucket),
  piggyPlans: z.array(z.object({ piggyId: id, planned: paise.nonnegative() })),
  entries: z.array(entry),
  recurringLog: z.array(
    z.object({ ruleId: id, status: z.enum(["logged", "skipped"]), entryId: id.exactOptional() }),
  ),
  alertsShown: z.array(
    z.object({ bucketId: id, threshold: z.union([z.literal(80), z.literal(100)]) }),
  ),
  createdAt: isoDate,
  closedAt: isoDate.exactOptional(),
  recapSeenAt: isoDate.exactOptional(),
});

const piggyTxn = z.object({
  id,
  type: z.enum(["opening", "stash", "leftover", "spend"]),
  amount: positivePaise,
  note: z.string().exactOptional(),
  date: isoDate,
  monthKey,
  createdAt: isoDate,
});

const piggy = z.object({
  id,
  name: z.string(),
  emoji: z.string(),
  target: paise.nonnegative(),
  targetDate: dayKey.exactOptional(),
  repeat: z.enum(["none", "yearly"]),
  autoStash: z.boolean(),
  status: z.enum(["active", "completed"]),
  createdAt: isoDate,
  completedAt: isoDate.exactOptional(),
  transactions: z.array(piggyTxn),
});

const recurringRule = z.object({
  id,
  name: z.string(),
  amount: positivePaise,
  bucketId: id,
  dayOfMonth: z.int().min(1).max(31),
  mode: z.enum(["auto", "ask"]),
  active: z.boolean(),
  createdAt: isoDate,
});

const favorite = z.object({
  id,
  label: z.string(),
  emoji: z.string().exactOptional(),
  amount: positivePaise,
  bucketId: id,
  order: z.int(),
});

const settings = z.object({
  currency: z.literal("INR"),
  hideAmountsOnOpen: z.boolean(),
  pin: z
    .object({ hash: z.string(), salt: z.string(), iterations: z.int().positive() })
    .exactOptional(),
  lockAfter: z.enum(["immediately", "1m", "5m"]),
  monthlyBackupStep: z.boolean(),
  motion: z.enum(["system", "reduced"]),
});

export const appStateSchema = z.object({
  schemaVersion: z.literal(1),
  profile: z.object({ name: z.string().exactOptional() }),
  settings,
  activeMonthKey: monthKey.nullable(),
  months: z.record(monthKey, month),
  piggies: z.array(piggy),
  recurring: z.array(recurringRule),
  favorites: z.array(favorite),
  meta: z.object({
    createdAt: isoDate,
    lastBackupAt: isoDate.exactOptional(),
    dismissedFavoriteSuggestions: z.array(z.string()),
    installGuideDismissed: z.boolean().exactOptional(),
  }),
});

// Compile-time check: the schema and the AppState type must describe the same shape
type Parsed = z.infer<typeof appStateSchema>;
type Same<A, B> = [A] extends [B] ? ([B] extends [A] ? true : false) : false;
export const schemaMatchesTypes: Same<Parsed, AppState> = true;

export function parseAppState(data: unknown): AppState | null {
  const result = appStateSchema.safeParse(data);
  return result.success ? result.data : null;
}

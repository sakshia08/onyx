/**
 * The saved data (PRD §11). Changing any of this shape means bumping `schemaVersion`
 * and adding a migration with a test (see migrations.ts).
 */

import type { BucketColor } from "./bucket-colors";
import type { BucketKind } from "./budget";
import type { Paise } from "./money";

export type ID = string;
/** "2026-11" */
export type MonthKey = string;
/** Local date-time without a timezone, "2026-11-18T13:42:00" (PROGRESS decision e). */
export type ISODate = string;
/** Local calendar date, "2027-03-15". */
export type DayKey = string;

export interface AppState {
  schemaVersion: 1;
  profile: { name?: string };
  settings: Settings;
  activeMonthKey: MonthKey | null;
  months: Record<MonthKey, Month>;
  piggies: Piggy[];
  recurring: RecurringRule[];
  favorites: Favorite[];
  meta: {
    createdAt: ISODate;
    lastBackupAt?: ISODate;
    /** "note|amount|bucketId" */
    dismissedFavoriteSuggestions: string[];
    installGuideDismissed?: boolean;
  };
}

export interface Month {
  key: MonthKey;
  status: "active" | "closed";
  totalBudget: Paise;
  buckets: Bucket[];
  piggyPlans: PiggyPlan[];
  entries: Entry[];
  recurringLog: RecurringLogItem[];
  alertsShown: AlertShown[];
  createdAt: ISODate;
  closedAt?: ISODate;
  recapSeenAt?: ISODate;
}

export interface PiggyPlan {
  piggyId: ID;
  planned: Paise;
}

export interface RecurringLogItem {
  ruleId: ID;
  status: "logged" | "skipped";
  entryId?: ID;
}

export type AlertThreshold = 80 | 100;

export interface AlertShown {
  bucketId: ID;
  threshold: AlertThreshold;
}

export interface Bucket {
  /** Stable across months: copied along with the plan. */
  id: ID;
  name: string;
  emoji: string;
  color: BucketColor;
  kind: BucketKind;
  allocated: Paise;
  order: number;
}

export type EntryType = "expense" | "refund";

export interface Entry {
  id: ID;
  /** "refund" is shown as "money back". */
  type: EntryType;
  bucketId: ID;
  /** Always positive. */
  amount: Paise;
  note?: string;
  date: ISODate;
  createdAt: ISODate;
  updatedAt?: ISODate;
  source: "manual" | "favorite" | "recurring";
  recurringRuleId?: ID;
}

export interface Piggy {
  id: ID;
  name: string;
  emoji: string;
  target: Paise;
  targetDate?: DayKey;
  repeat: "none" | "yearly";
  autoStash: boolean;
  status: "active" | "completed";
  createdAt: ISODate;
  completedAt?: ISODate;
  transactions: PiggyTxn[];
}

export type PiggyTxnType = "opening" | "stash" | "leftover" | "spend";

export interface PiggyTxn {
  id: ID;
  type: PiggyTxnType;
  /** Always positive. */
  amount: Paise;
  note?: string;
  date: ISODate;
  /** For "leftover": the month the money came from. Otherwise the month of `date`. */
  monthKey: MonthKey;
  createdAt: ISODate;
}

export interface RecurringRule {
  id: ID;
  name: string;
  amount: Paise;
  bucketId: ID;
  /** 1–31, moved to the month's last day in shorter months. */
  dayOfMonth: number;
  mode: "auto" | "ask";
  active: boolean;
  createdAt: ISODate;
}

export interface Favorite {
  id: ID;
  label: string;
  emoji?: string;
  amount: Paise;
  bucketId: ID;
  order: number;
}

export interface Settings {
  currency: "INR";
  hideAmountsOnOpen: boolean;
  pin?: { hash: string; salt: string; iterations: number };
  lockAfter: "immediately" | "1m" | "5m";
  /** The backup card in the month-end recap. */
  monthlyBackupStep: boolean;
  motion: "system" | "reduced";
}

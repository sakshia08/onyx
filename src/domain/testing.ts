/**
 * Test fixtures: the PRD §7.5 setup. November 2026 (30 days), budget ₹60,000.
 * Buckets: Commute ₹3,000, Food ₹8,000, Leisure ₹2,000 (spend); Investing ₹15,000,
 * Saving ₹25,000 (save). Piggy plan: Goa trip ₹6,000. Used only by tests.
 */

import { rupees, type Paise } from "./money";
import type { Bucket, Entry, ID, ISODate, Month, Piggy, PiggyTxn, RecurringRule } from "./types";

export const NOV = "2026-11";

export const BUCKETS: Bucket[] = [
  {
    id: "commute",
    name: "Commute",
    emoji: "🚇",
    color: "blue",
    kind: "spend",
    allocated: rupees(3_000),
    order: 0,
  },
  {
    id: "food",
    name: "Food",
    emoji: "🍜",
    color: "orange",
    kind: "spend",
    allocated: rupees(8_000),
    order: 1,
  },
  {
    id: "leisure",
    name: "Leisure",
    emoji: "🎉",
    color: "rose",
    kind: "spend",
    allocated: rupees(2_000),
    order: 2,
  },
  {
    id: "investing",
    name: "Investing",
    emoji: "📈",
    color: "green",
    kind: "save",
    allocated: rupees(15_000),
    order: 3,
  },
  {
    id: "saving",
    name: "Saving",
    emoji: "🏦",
    color: "teal",
    kind: "save",
    allocated: rupees(25_000),
    order: 4,
  },
];

export function bucket(id: ID): Bucket {
  const b = BUCKETS.find((x) => x.id === id);
  if (b === undefined) throw new Error(`No bucket ${id}`);
  return b;
}

let counter = 0;
export function newId(): ID {
  counter += 1;
  return `id-${String(counter)}`;
}

export function entry(
  bucketId: ID,
  amount: Paise,
  options: Partial<Omit<Entry, "bucketId" | "amount">> = {},
): Entry {
  const date = options.date ?? "2026-11-18T12:00:00";
  return {
    id: newId(),
    type: "expense",
    bucketId,
    amount,
    date,
    createdAt: date,
    source: "manual",
    ...options,
  };
}

export function november(overrides: Partial<Month> = {}): Month {
  return {
    key: NOV,
    status: "active",
    totalBudget: rupees(60_000),
    buckets: BUCKETS.map((b) => ({ ...b })),
    piggyPlans: [{ piggyId: "goa", planned: rupees(6_000) }],
    entries: [],
    recurringLog: [],
    alertsShown: [],
    createdAt: "2026-11-01T08:00:00",
    ...overrides,
  };
}

export function txn(
  type: PiggyTxn["type"],
  amount: Paise,
  date: ISODate,
  monthKey: string = date.slice(0, 7),
): PiggyTxn {
  return { id: newId(), type, amount, date, monthKey, createdAt: date };
}

/** Goa trip: target ₹30,000 by 15 March 2027, created 1 Nov 2026 with ₹0. */
export function goaTrip(overrides: Partial<Piggy> = {}): Piggy {
  return {
    id: "goa",
    name: "Goa trip",
    emoji: "🌴",
    target: rupees(30_000),
    targetDate: "2027-03-15",
    repeat: "none",
    autoStash: false,
    status: "active",
    createdAt: "2026-11-01T09:00:00",
    transactions: [],
    ...overrides,
  };
}

export function rule(overrides: Partial<RecurringRule> = {}): RecurringRule {
  return {
    id: "netflix",
    name: "Netflix",
    amount: rupees(649),
    bucketId: "leisure",
    dayOfMonth: 28,
    mode: "auto",
    active: true,
    createdAt: "2026-10-01T09:00:00",
    ...overrides,
  };
}

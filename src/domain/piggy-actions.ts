/**
 * Changing piggy banks (PRD §8.6): create, edit, stash, spend, auto-stash, done.
 * Pure functions that return a new piggy. Integer paise only.
 */

import { daysBetween, dayKeyOfDate, monthKeyOf, monthKeyOfDate, toISODate } from "./dates";
import { ceilDiv, MAX_ENTRY_PAISE, roundUpToRupee, sumPaise, type Paise } from "./money";
import {
  currentCycle,
  monthsLeft,
  piggyBalance,
  plannedThisMonth,
  toStashThisMonth,
} from "./piggy";
import type { DayKey, ID, ISODate, Month, Piggy, PiggyTxn } from "./types";

export const MAX_PIGGY_NAME = 30;

export interface PiggyDraft {
  name: string;
  emoji: string;
  target: Paise;
  targetDate?: DayKey;
  repeat: Piggy["repeat"];
  autoStash: boolean;
}

export type PiggyProblem =
  "name-missing" | "target" | "date-past" | "yearly-needs-date" | "opening";

/** What's wrong with a piggy being created or edited, if anything. */
export function piggyProblem(
  draft: PiggyDraft,
  opening: Paise,
  today: DayKey,
): PiggyProblem | null {
  if (draft.name.trim() === "") return "name-missing";
  if (!Number.isSafeInteger(draft.target) || draft.target <= 0 || draft.target > MAX_ENTRY_PAISE) {
    return "target";
  }
  if (draft.targetDate !== undefined && draft.targetDate < today) return "date-past";
  if (draft.repeat === "yearly" && draft.targetDate === undefined) return "yearly-needs-date";
  if (!Number.isSafeInteger(opening) || opening < 0 || opening > MAX_ENTRY_PAISE) return "opening";
  return null;
}

function txn(
  type: PiggyTxn["type"],
  amount: Paise,
  id: ID,
  date: ISODate,
  note?: string,
): PiggyTxn {
  return {
    id,
    type,
    amount,
    date,
    monthKey: monthKeyOf(date),
    createdAt: date,
    ...(note !== undefined && note.trim() !== "" ? { note: note.trim() } : {}),
  };
}

function details(draft: PiggyDraft) {
  return {
    name: draft.name.trim(),
    emoji: draft.emoji,
    target: draft.target,
    repeat: draft.repeat,
    autoStash: draft.autoStash,
    ...(draft.targetDate !== undefined ? { targetDate: draft.targetDate } : {}),
  };
}

/** A new piggy. "Already saved ₹X" becomes its opening balance. */
export function createPiggy(
  draft: PiggyDraft,
  opening: Paise,
  ids: { piggy: ID; opening: ID },
  now: Date,
): Piggy {
  const at = toISODate(now);
  return {
    id: ids.piggy,
    ...details(draft),
    status: "active",
    createdAt: at,
    transactions: opening > 0 ? [txn("opening", opening, ids.opening, at)] : [],
  };
}

/** Saves edited details. The history is never changed by an edit. */
export function updatePiggy(piggy: Piggy, draft: PiggyDraft): Piggy {
  const next: Piggy = { ...piggy, ...details(draft) };
  if (draft.targetDate === undefined) delete next.targetDate;
  return next;
}

/** A stash: money from this month's budget into the piggy (counts toward the month's used). */
export function stashInto(piggy: Piggy, amount: Paise, id: ID, now: Date, note?: string): Piggy {
  if (amount <= 0) return piggy;
  return {
    ...piggy,
    transactions: [...piggy.transactions, txn("stash", amount, id, toISODate(now), note)],
  };
}

/** Spending from a piggy. It only reduces the piggy, never the month (PRD §7.4). */
export function spendFrom(
  piggy: Piggy,
  amount: Paise,
  id: ID,
  date: ISODate,
  note?: string,
): Piggy {
  if (amount <= 0) return piggy;
  return { ...piggy, transactions: [...piggy.transactions, txn("spend", amount, id, date, note)] };
}

export function removeTxn(piggy: Piggy, txnId: ID): { piggy: Piggy; removed: PiggyTxn | null } {
  const removed = piggy.transactions.find((t) => t.id === txnId) ?? null;
  if (removed === null) return { piggy, removed };
  return {
    piggy: { ...piggy, transactions: piggy.transactions.filter((t) => t.id !== txnId) },
    removed,
  };
}

/** Undo: puts a transaction back exactly as it was. */
export function restoreTxn(piggy: Piggy, t: PiggyTxn): Piggy {
  return {
    ...piggy,
    transactions: [...piggy.transactions.filter((x) => x.id !== t.id), t],
  };
}

/** True the first time the balance reaches the target: confetti and "You did it!". */
export function justReachedGoal(before: Piggy, after: Piggy): boolean {
  return piggyBalance(before) < before.target && piggyBalance(after) >= after.target;
}

export function markDone(piggy: Piggy, now: Date): Piggy {
  return { ...piggy, status: "completed", completedAt: toISODate(now) };
}

export function reopen(piggy: Piggy): Piggy {
  const next: Piggy = { ...piggy, status: "active" };
  delete next.completedAt;
  return next;
}

/** Saved vs spent, for the summary when a piggy is marked done. */
export function piggySummary(piggy: Piggy): { saved: Paise; spent: Paise } {
  const ofType = (types: PiggyTxn["type"][]) =>
    sumPaise(piggy.transactions.filter((t) => types.includes(t.type)).map((t) => t.amount));
  return { saved: ofType(["opening", "stash", "leftover"]), spent: ofType(["spend"]) };
}

/**
 * Moves what's left in one piggy into another (when a piggy is done). Not month money,
 * so it's a spend from one and an opening amount on the other, never a stash.
 */
export function moveBalance(
  from: Piggy,
  to: Piggy,
  ids: { out: ID; in: ID },
  now: Date,
): { from: Piggy; to: Piggy } {
  const amount = piggyBalance(from);
  if (amount <= 0 || from.id === to.id) return { from, to };
  const at = toISODate(now);
  return {
    from: {
      ...from,
      transactions: [
        ...from.transactions,
        txn("spend", amount, ids.out, at, `Moved to ${to.name}`),
      ],
    },
    to: {
      ...to,
      transactions: [...to.transactions, txn("opening", amount, ids.in, at, `From ${from.name}`)],
    },
  };
}

/** Auto-stash ids are fixed per piggy and month, so it can never happen twice. */
export function autoStashId(piggyId: ID, monthKey: string): ID {
  return `auto-${piggyId}-${monthKey}`;
}

/**
 * Auto-stash (PRD §8.6): once the month is set up, each piggy with auto-stash on gets what's
 * left of its plan for the month. A piggy created during this month starts next month.
 * Returns the piggies (changed or not) and how many were stashed into.
 */
export function runAutoStash(
  piggies: readonly Piggy[],
  month: Month,
  now: Date,
): { piggies: Piggy[]; stashed: number } {
  if (month.status !== "active" || month.key !== monthKeyOfDate(now)) {
    return { piggies: [...piggies], stashed: 0 };
  }
  const today = dayKeyOfDate(now);
  let stashed = 0;
  const next = piggies.map((p) => {
    const id = autoStashId(p.id, month.key);
    if (
      !p.autoStash ||
      p.status !== "active" ||
      monthKeyOf(p.createdAt) >= month.key ||
      p.transactions.some((t) => t.id === id)
    ) {
      return p;
    }
    const amount = toStashThisMonth(p, month, today);
    if (amount <= 0 || plannedThisMonth(p, month, today) <= 0) return p;
    stashed += 1;
    return stashInto(p, amount, id, now, "Auto-stash");
  });
  return { piggies: next, stashed };
}

/** Days until a piggy's (current cycle's) target date, or null without a date. */
export function daysToGo(piggy: Piggy, today: DayKey): number | null {
  const cycle = currentCycle(piggy, today);
  return cycle === null ? null : daysBetween(today, cycle.targetDate);
}

/** The piggy for Home's peek: the active one with the nearest date (no date last). */
export function nearestPiggy(piggies: readonly Piggy[], today: DayKey): Piggy | null {
  const active = piggies.filter((p) => p.status === "active");
  const dated = (p: Piggy) => currentCycle(p, today)?.targetDate ?? "9999-12-31";
  return (
    [...active].sort((a, b) => (dated(a) < dated(b) ? -1 : dated(a) > dated(b) ? 1 : 0))[0] ?? null
  );
}

/** Yearly piggies: a small "New cycle started" note in the month a new cycle begins. */
export function startedNewCycle(piggy: Piggy, today: DayKey): boolean {
  const cycle = currentCycle(piggy, today);
  return (
    piggy.repeat === "yearly" &&
    cycle !== null &&
    cycle.targetDate !== piggy.targetDate &&
    cycle.startMonth === monthKeyOf(today)
  );
}

/** The live line while creating a piggy: "₹6,000/month for 5 months" (PRD §8.6). */
export function monthlyPreview(
  target: Paise,
  opening: Paise,
  targetDate: DayKey | undefined,
  today: DayKey,
): { perMonth: Paise; months: number } | null {
  if (targetDate === undefined || target <= 0) return null;
  const months = monthsLeft(monthKeyOf(today), targetDate);
  const needed = Math.max(0, target - opening);
  return { perMonth: roundUpToRupee(ceilDiv(needed, months)), months };
}

/** Templates for a new piggy (PRD §8.6). Only Insurance is yearly, as the PRD lists it. */
export const PIGGY_TEMPLATES: readonly { name: string; emoji: string; repeat: Piggy["repeat"] }[] =
  [
    { name: "Trip", emoji: "✈️", repeat: "none" },
    { name: "Birthday", emoji: "🎂", repeat: "none" },
    { name: "Diwali", emoji: "🪔", repeat: "none" },
    { name: "New phone", emoji: "📱", repeat: "none" },
    { name: "Emergency fund", emoji: "🛟", repeat: "none" },
    { name: "Insurance", emoji: "🛡️", repeat: "yearly" },
  ];

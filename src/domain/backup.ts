/**
 * Backup files and restore (PRD §8.11). A backup is a small JSON file saved to the
 * iPhone's Files app. Restoring validates it first and keeps a safety copy for "Undo restore".
 */

import { daysBetween, dayKeyOf, dayKeyOfDate, toISODate } from "./dates";
import { migrate } from "./migrations";
import type { AppState, ISODate } from "./types";

const APP_ID = "onyx";
const OVERDUE_DAYS = 35;

interface BackupFile {
  app: typeof APP_ID;
  schemaVersion: number;
  exportedAt: ISODate;
  data: AppState;
}

/** "onyx-backup-2026-11-18.json" */
export function backupFilename(now: Date): string {
  return `onyx-backup-${dayKeyOfDate(now)}.json`;
}

export function createBackup(state: AppState, now: Date): { filename: string; text: string } {
  const file: BackupFile = {
    app: APP_ID,
    schemaVersion: state.schemaVersion,
    exportedAt: toISODate(now),
    data: state,
  };
  return { filename: backupFilename(now), text: JSON.stringify(file, null, 2) };
}

export interface BackupSummary {
  months: number;
  entries: number;
  piggies: number;
  /** When the data was first created, e.g. "2026-10-26T09:28:00". */
  since: ISODate;
  exportedAt: ISODate;
}

export type ParseBackupResult =
  | { ok: true; state: AppState; summary: BackupSummary }
  | { ok: false; reason: "not-json" | "not-a-backup" | "newer-version" | "invalid" };

/** Reads a backup file's text. Never throws; always says why a file can't be used. */
export function parseBackup(text: string): ParseBackupResult {
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    return { ok: false, reason: "not-json" };
  }
  if (typeof raw !== "object" || raw === null || (raw as { app?: unknown }).app !== APP_ID) {
    return { ok: false, reason: "not-a-backup" };
  }
  const file = raw as Partial<BackupFile>;
  const result = migrate(file.data);
  if (!result.ok) {
    return { ok: false, reason: result.reason === "newer-version" ? "newer-version" : "invalid" };
  }
  const state = result.state;
  const months = Object.values(state.months);
  return {
    ok: true,
    state,
    summary: {
      months: months.length,
      entries: months.reduce((n, m) => n + m.entries.length, 0),
      piggies: state.piggies.length,
      since: state.meta.createdAt,
      exportedAt: typeof file.exportedAt === "string" ? file.exportedAt : state.meta.createdAt,
    },
  };
}

/** Amber "no backup for a while" status: never backed up, or more than 35 days ago. */
export function isBackupOverdue(lastBackupAt: ISODate | undefined, now: Date): boolean {
  if (lastBackupAt === undefined) return true;
  return daysBetween(dayKeyOf(lastBackupAt), dayKeyOfDate(now)) > OVERDUE_DAYS;
}

/** Recorded only after the share sheet completes; a cancelled share changes nothing. */
export function recordBackup(state: AppState, now: Date): AppState {
  return { ...state, meta: { ...state.meta, lastBackupAt: toISODate(now) } };
}

export interface SafetyCopy {
  state: AppState;
  takenAt: ISODate;
}

/** A restore: the new data, plus a safety copy of what was on the phone, for "Undo restore". */
export function prepareRestore(
  current: AppState,
  incoming: AppState,
  now: Date,
): { state: AppState; safetyCopy: SafetyCopy } {
  return {
    state: structuredClone(incoming),
    safetyCopy: { state: structuredClone(current), takenAt: toISODate(now) },
  };
}

/** "Undo restore": exactly the data from before the restore. */
export function undoRestore(safetyCopy: SafetyCopy): AppState {
  return structuredClone(safetyCopy.state);
}

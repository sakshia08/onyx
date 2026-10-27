/**
 * Upgrading saved data from older versions (PRD §11). Saved data must never be lost:
 * whenever the shape in types.ts changes, bump CURRENT_SCHEMA_VERSION, add a migration
 * from the old version here, and add a test for it.
 */

import { parseAppState } from "./schema";
import { CURRENT_SCHEMA_VERSION } from "./state";
import type { AppState } from "./types";

/** Turns data saved at version n into version n + 1. */
export type Migration = (data: Record<string, unknown>) => Record<string, unknown>;

/** Keyed by the version they upgrade from. Version 1 is the first, so there are none yet. */
export const MIGRATIONS: Record<number, Migration> = {};

export type MigrateResult =
  | { ok: true; state: AppState; fromVersion: number }
  | { ok: false; reason: "invalid" | "newer-version" | "unknown-version" };

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/**
 * Brings saved data up to the current version, then checks its shape.
 * Data from a newer app version is refused, never guessed at.
 */
export function migrate(
  raw: unknown,
  migrations: Record<number, Migration> = MIGRATIONS,
  currentVersion: number = CURRENT_SCHEMA_VERSION,
  parse: (data: unknown) => AppState | null = parseAppState,
): MigrateResult {
  if (!isRecord(raw)) return { ok: false, reason: "invalid" };
  const version = raw.schemaVersion;
  if (typeof version !== "number" || !Number.isInteger(version) || version < 1) {
    return { ok: false, reason: "invalid" };
  }
  if (version > currentVersion) return { ok: false, reason: "newer-version" };

  let data: Record<string, unknown> = structuredClone(raw);
  for (let v = version; v < currentVersion; v++) {
    const step = migrations[v];
    if (step === undefined) return { ok: false, reason: "unknown-version" };
    data = { ...step(data), schemaVersion: v + 1 };
  }

  const state = parse(data);
  return state === null
    ? { ok: false, reason: "invalid" }
    : { ok: true, state, fromVersion: version };
}

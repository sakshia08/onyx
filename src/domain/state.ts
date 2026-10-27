/**
 * The starting point for a brand-new install.
 */

import { toISODate } from "./dates";
import type { AppState, Settings } from "./types";

export const CURRENT_SCHEMA_VERSION = 1;

export const DEFAULT_SETTINGS: Settings = {
  currency: "INR",
  hideAmountsOnOpen: false,
  lockAfter: "immediately",
  monthlyBackupStep: true,
  motion: "system",
};

export function createEmptyState(now: Date): AppState {
  return {
    schemaVersion: CURRENT_SCHEMA_VERSION,
    profile: {},
    settings: { ...DEFAULT_SETTINGS },
    activeMonthKey: null,
    months: {},
    piggies: [],
    recurring: [],
    favorites: [],
    meta: { createdAt: toISODate(now), dismissedFavoriteSuggestions: [] },
  };
}

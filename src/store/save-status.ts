import { createStore } from "zustand/vanilla";

export type LoadError = "newer-version" | "invalid" | "unreadable";

export interface SaveStatus {
  /** True once saved data has loaded (or there was none). Show the splash until then. */
  hydrated: boolean;
  /** Saved data exists but can't be used. Nothing is ever written over it. */
  loadError: LoadError | null;
  /** The last save failed, e.g. the phone is full. Cleared by the next successful save. */
  saveFailed: boolean;
}

/**
 * Loading and saving status, kept apart from the saved data so that reporting a failed
 * save never triggers another save.
 */
export function createSaveStatus() {
  return createStore<SaveStatus>()(() => ({ hydrated: false, loadError: null, saveFailed: false }));
}

export type SaveStatusStore = ReturnType<typeof createSaveStatus>;

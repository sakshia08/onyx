import { get, set, del } from "idb-keyval";
import type { PersistStorage, StorageValue } from "zustand/middleware";
import { toISODate } from "@/domain/dates";
import { CURRENT_SCHEMA_VERSION } from "@/domain/state";

/** What's written to IndexedDB under the main key. */
export interface Persisted {
  data: unknown;
}

export interface GuardedStorage extends PersistStorage<Persisted> {
  /** Called once saved data has loaded and checked out. Until then, nothing is written. */
  allowWrites: () => void;
}

export interface GuardedStorageOptions {
  /** IndexedDB key for the copy kept before an upgrade, e.g. "onyx-before-upgrade". */
  upgradeCopyKey: string;
  onSaveResult: (ok: boolean) => void;
  now?: () => Date;
}

function savedVersion(value: unknown): number | null {
  const data = (value as { state?: { data?: { schemaVersion?: unknown } } } | null)?.state?.data;
  return typeof data?.schemaVersion === "number" ? data.schemaVersion : null;
}

/**
 * IndexedDB storage for Zustand's persist that can never lose saved data:
 * - Writes are blocked until the saved data has loaded and been checked, so a failed or
 *   unfinished load can't be overwritten by an empty app.
 * - Before older data is upgraded, the raw copy is kept under its own key.
 * - A failed write is reported (e.g. phone full), never thrown away silently.
 */
export function createGuardedStorage(options: GuardedStorageOptions): GuardedStorage {
  const now = options.now ?? (() => new Date());
  let writesAllowed = false;

  return {
    allowWrites: () => {
      writesAllowed = true;
    },

    async getItem(name) {
      const value = await get<StorageValue<Persisted>>(name);
      if (value === undefined) return null;
      const version = savedVersion(value);
      if (version !== null && version < CURRENT_SCHEMA_VERSION) {
        // Keep the untouched old data before anything is upgraded (PRD §8.11 safety copy)
        await set(options.upgradeCopyKey, { takenAt: toISODate(now()), value });
      }
      return value;
    },

    async setItem(name, value) {
      if (!writesAllowed) return;
      try {
        await set(name, value);
        options.onSaveResult(true);
      } catch {
        options.onSaveResult(false);
      }
    },

    async removeItem(name) {
      if (!writesAllowed) return;
      await del(name);
    },
  };
}

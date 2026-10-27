import { get as idbGet, set as idbSet } from "idb-keyval";
import { persist } from "zustand/middleware";
import { createStore } from "zustand/vanilla";
import { prepareRestore, type SafetyCopy } from "@/domain/backup";
import { migrate } from "@/domain/migrations";
import { CURRENT_SCHEMA_VERSION, createEmptyState } from "@/domain/state";
import type { AppState } from "@/domain/types";
import { createGuardedStorage, type Persisted } from "./guarded-storage";
import { createSaveStatus, type LoadError } from "./save-status";

export interface AppStore {
  data: AppState;
  /** Every change goes through here. Ignored until saved data has loaded. */
  update: (recipe: (data: AppState) => AppState) => void;
  /** Replaces everything with a backup, keeping a safety copy first (PRD §8.11). */
  restore: (incoming: AppState) => Promise<void>;
  /** Brings the safety copy back. False if there isn't a usable one. */
  undoRestore: () => Promise<boolean>;
}

class LoadFailure extends Error {
  readonly reason: LoadError;
  constructor(reason: LoadError) {
    super(`Saved data can't be loaded: ${reason}`);
    this.reason = reason;
  }
}

export interface AppStoreOptions {
  /** IndexedDB key for the saved data. */
  key?: string;
  /** IndexedDB key for the restore safety copy, stored outside AppState (PRD §11). */
  safetyKey?: string;
  /** IndexedDB key for the raw copy kept before a data upgrade. */
  upgradeCopyKey?: string;
  now?: () => Date;
}

/**
 * The saved store (PRD §11, §12): Zustand persist → IndexedDB through idb-keyval.
 * Loading runs every saved shape through the migrations and the schema check;
 * if that fails, the saved data is left exactly as it is and nothing is written.
 */
export function createAppStore({
  key = "onyx",
  safetyKey = "onyx-safety-copy",
  upgradeCopyKey = "onyx-before-upgrade",
  now = () => new Date(),
}: AppStoreOptions = {}) {
  const status = createSaveStatus();
  const storage = createGuardedStorage({
    upgradeCopyKey,
    now,
    onSaveResult: (ok) => {
      status.setState({ saveFailed: !ok });
    },
  });

  const store = createStore<AppStore>()(
    persist<AppStore, [], [], Persisted>(
      (set, get) => ({
        data: createEmptyState(now()),

        update: (recipe) => {
          if (!status.getState().hydrated) return;
          set({ data: recipe(get().data) });
        },

        restore: async (incoming) => {
          const { state, safetyCopy } = prepareRestore(get().data, incoming, now());
          // The safety copy must be saved before anything is replaced
          await idbSet(safetyKey, safetyCopy);
          set({ data: state });
        },

        undoRestore: async () => {
          const copy = await idbGet<SafetyCopy>(safetyKey);
          const result = migrate(copy?.state);
          if (!result.ok) return false;
          set({ data: result.state });
          return true;
        },
      }),
      {
        name: key,
        version: CURRENT_SCHEMA_VERSION,
        storage,
        partialize: (s) => ({ data: s.data }),
        // Versions are handled by our own migrations, in merge below
        migrate: (persisted) => persisted as Persisted,
        merge: (persisted, current) => {
          if (persisted === undefined) {
            // Nothing saved yet: a brand-new install
            storage.allowWrites();
            return current;
          }
          const result = migrate((persisted as Persisted).data);
          if (!result.ok) {
            throw new LoadFailure(result.reason === "newer-version" ? "newer-version" : "invalid");
          }
          storage.allowWrites();
          return { ...current, data: result.state };
        },
        onRehydrateStorage: () => (_state, error) => {
          if (error === undefined) {
            status.setState({ hydrated: true });
          } else {
            status.setState({
              loadError: error instanceof LoadFailure ? error.reason : "unreadable",
            });
          }
        },
      },
    ),
  );

  return { store, status };
}

import { useStore } from "zustand";
import { createAppStore, type AppStore } from "./app-store";
import type { SaveStatus } from "./save-status";

/** The app's one store. Loading starts as soon as this module is imported. */
export const { store: appStore, status: saveStatus } = createAppStore();

export function useAppStore<T>(selector: (s: AppStore) => T): T {
  return useStore(appStore, selector);
}

export function useSaveStatus<T>(selector: (s: SaveStatus) => T): T {
  return useStore(saveStatus, selector);
}

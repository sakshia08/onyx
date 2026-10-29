import { useStore } from "zustand";
import { createStore } from "zustand/vanilla";
import type { TryState } from "@/domain/pin";

export interface PrivacyState {
  /** The eye: every amount shows as "₹ ••••" (PRD §8.10). Not saved; starts from the setting. */
  amountsHidden: boolean;
  /** The PIN lock screen is up. */
  locked: boolean;
  tries: TryState;
}

/** Privacy state for this session only. It is never written to storage. */
export const privacyStore = createStore<PrivacyState>()(() => ({
  amountsHidden: false,
  locked: false,
  tries: { failures: 0, lockedUntil: 0 },
}));

export function usePrivacy<T>(selector: (s: PrivacyState) => T): T {
  return useStore(privacyStore, selector);
}

export function toggleAmountsHidden(): void {
  privacyStore.setState((s) => ({ amountsHidden: !s.amountsHidden }));
}

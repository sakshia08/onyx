/**
 * The PIN lock (PRD §8.10). It's a privacy screen, not encryption: the data itself isn't
 * encrypted. The PIN is kept only as a PBKDF2 hash with a random salt (Web Crypto).
 */

import type { Settings } from "./types";

export const PIN_LENGTH = 4;
export const PIN_ITERATIONS = 210_000;
export const MAX_TRIES = 5;
export const COOLDOWN_MS = 30_000;

export type StoredPin = NonNullable<Settings["pin"]>;

export function isValidPin(pin: string): boolean {
  return new RegExp(`^\\d{${String(PIN_LENGTH)}}$`).test(pin);
}

function toBase64(bytes: Uint8Array): string {
  return btoa(String.fromCharCode(...bytes));
}

function fromBase64(text: string): Uint8Array<ArrayBuffer> {
  return Uint8Array.from(atob(text), (c) => c.charCodeAt(0));
}

async function derive(
  pin: string,
  salt: Uint8Array<ArrayBuffer>,
  iterations: number,
): Promise<string> {
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(pin), "PBKDF2", false, [
    "deriveBits",
  ]);
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", hash: "SHA-256", salt, iterations },
    key,
    256,
  );
  return toBase64(new Uint8Array(bits));
}

/** Hashes a new PIN with a fresh random salt. */
export async function createPin(pin: string, iterations = PIN_ITERATIONS): Promise<StoredPin> {
  if (!isValidPin(pin)) throw new Error("A PIN is 4 digits");
  const salt = crypto.getRandomValues(new Uint8Array(16));
  return { hash: await derive(pin, salt, iterations), salt: toBase64(salt), iterations };
}

/** Checks a PIN against the stored hash, comparing every character (no early exit). */
export async function checkPin(pin: string, stored: StoredPin): Promise<boolean> {
  if (!isValidPin(pin)) return false;
  const hash = await derive(pin, fromBase64(stored.salt), stored.iterations);
  if (hash.length !== stored.hash.length) return false;
  let diff = 0;
  for (let i = 0; i < hash.length; i++) diff |= hash.charCodeAt(i) ^ stored.hash.charCodeAt(i);
  return diff === 0;
}

const LOCK_AFTER_MS: Record<Settings["lockAfter"], number> = {
  immediately: 0,
  "1m": 60_000,
  "5m": 300_000,
};

/** Coming back to the app: lock again if it was away for at least the chosen time. */
export function shouldLockOnReturn(
  lockAfter: Settings["lockAfter"],
  hiddenAt: number,
  now: number,
): boolean {
  return now - hiddenAt >= LOCK_AFTER_MS[lockAfter];
}

export interface TryState {
  failures: number;
  /** Epoch ms until which no tries are allowed, or 0. */
  lockedUntil: number;
}

/** After a wrong PIN: 5 wrong tries in a row start a 30-second cooldown (PRD §8.10). */
export function afterWrongPin(state: TryState, now: number): TryState {
  const failures = state.failures + 1;
  return failures >= MAX_TRIES
    ? { failures: 0, lockedUntil: now + COOLDOWN_MS }
    : { failures, lockedUntil: state.lockedUntil };
}

export function cooldownLeft(state: TryState, now: number): number {
  return Math.max(0, state.lockedUntil - now);
}

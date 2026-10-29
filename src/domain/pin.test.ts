import { describe, expect, it } from "vitest";
import {
  afterWrongPin,
  checkPin,
  cooldownLeft,
  createPin,
  isValidPin,
  shouldLockOnReturn,
} from "./pin";

// Few iterations keep the tests quick; the app uses PIN_ITERATIONS
const FAST = 1_000;

describe("PIN (PRD §8.10)", () => {
  it("is exactly 4 digits", () => {
    expect(isValidPin("1234")).toBe(true);
    expect(isValidPin("123")).toBe(false);
    expect(isValidPin("12a4")).toBe(false);
    expect(isValidPin("12345")).toBe(false);
  });

  it("is stored only as a salted hash, never the digits", async () => {
    const stored = await createPin("2580", FAST);
    expect(JSON.stringify(stored)).not.toContain("2580");
    expect(stored.iterations).toBe(FAST);
    const again = await createPin("2580", FAST);
    expect(again.salt).not.toBe(stored.salt);
    expect(again.hash).not.toBe(stored.hash);
  });

  it("checks the right PIN and refuses a wrong one", async () => {
    const stored = await createPin("2580", FAST);
    expect(await checkPin("2580", stored)).toBe(true);
    expect(await checkPin("2581", stored)).toBe(false);
    expect(await checkPin("25", stored)).toBe(false);
  });

  it("5 wrong tries start a 30-second cooldown", () => {
    let state = { failures: 0, lockedUntil: 0 };
    for (let i = 0; i < 4; i++) state = afterWrongPin(state, 1_000);
    expect(cooldownLeft(state, 1_000)).toBe(0);
    state = afterWrongPin(state, 1_000);
    expect(cooldownLeft(state, 1_000)).toBe(30_000);
    expect(cooldownLeft(state, 31_000)).toBe(0);
    expect(state.failures).toBe(0);
  });

  it("locks again on return after the chosen time", () => {
    expect(shouldLockOnReturn("immediately", 0, 1)).toBe(true);
    expect(shouldLockOnReturn("1m", 0, 59_000)).toBe(false);
    expect(shouldLockOnReturn("1m", 0, 60_000)).toBe(true);
    expect(shouldLockOnReturn("5m", 0, 299_999)).toBe(false);
  });
});

import { describe, expect, it } from "vitest";
import { sampleState } from "./fixtures-state";
import { migrate, MIGRATIONS, type Migration } from "./migrations";
import { appStateSchema, parseAppState } from "./schema";
import { CURRENT_SCHEMA_VERSION } from "./state";
import type { AppState } from "./types";

describe("migrations (PRD §11)", () => {
  it("has a migration for every version below the current one", () => {
    for (let v = 1; v < CURRENT_SCHEMA_VERSION; v++) expect(MIGRATIONS[v]).toBeDefined();
  });

  it("loads current-version data unchanged", () => {
    const saved = sampleState();
    expect(migrate(saved)).toEqual({ ok: true, state: saved, fromVersion: 1 });
  });

  it("refuses data from a newer version instead of guessing", () => {
    expect(migrate({ ...sampleState(), schemaVersion: 2 })).toEqual({
      ok: false,
      reason: "newer-version",
    });
  });

  it("refuses data that isn't an app state", () => {
    expect(migrate(null)).toEqual({ ok: false, reason: "invalid" });
    expect(migrate([])).toEqual({ ok: false, reason: "invalid" });
    expect(migrate({ schemaVersion: "1" })).toEqual({ ok: false, reason: "invalid" });
    expect(migrate({ schemaVersion: 1 })).toEqual({ ok: false, reason: "invalid" });
  });

  it("never changes the data it was given", () => {
    const raw = sampleState();
    const copy = structuredClone(raw);
    migrate(raw);
    expect(raw).toEqual(copy);
  });

  describe("runs each step in order (shown with made-up future versions)", () => {
    // Pretend v1 → v2 renamed profile.name to profile.displayName, and v2 → v3 added a flag
    const fake: Record<number, Migration> = {
      1: (d) => ({ ...d, profile: { displayName: (d.profile as { name?: string }).name } }),
      2: (d) => ({ ...d, flag: true }),
    };
    const passThrough = (data: unknown) => data as AppState;

    it("upgrades v1 data to v3", () => {
      const result = migrate(sampleState(), fake, 3, passThrough);
      expect(result.ok).toBe(true);
      if (!result.ok) return;
      expect(result.fromVersion).toBe(1);
      expect(result.state).toMatchObject({
        schemaVersion: 3,
        profile: { displayName: "Sakshi" },
        flag: true,
      });
    });

    it("refuses if a step is missing", () => {
      expect(migrate(sampleState(), { 1: fake[1] as Migration }, 3, passThrough)).toEqual({
        ok: false,
        reason: "unknown-version",
      });
    });
  });
});

describe("schema", () => {
  it("accepts a full, realistic state and a brand-new one", () => {
    const saved = sampleState();
    expect(parseAppState(saved)).toEqual(saved);
    expect(appStateSchema.safeParse({ ...sampleState(), months: {} }).success).toBe(true);
  });

  it("rejects money that isn't whole paise and negative entry amounts", () => {
    const state = sampleState();
    const nov = state.months["2026-11"];
    if (nov === undefined) throw new Error("fixture");
    const firstEntry = nov.entries[0];
    if (firstEntry === undefined) throw new Error("fixture");
    const fractional = { ...nov, entries: [{ ...firstEntry, amount: 10.5 }] };
    const negative = { ...nov, entries: [{ ...firstEntry, amount: -100 }] };
    expect(parseAppState({ ...state, months: { "2026-11": fractional } })).toBeNull();
    expect(parseAppState({ ...state, months: { "2026-11": negative } })).toBeNull();
  });
});

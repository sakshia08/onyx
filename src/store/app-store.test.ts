import "fake-indexeddb/auto";
import { get as idbGet, set as idbSet } from "idb-keyval";
import { describe, expect, it } from "vitest";
import { sampleState } from "@/domain/fixtures-state";
import { rupees } from "@/domain/money";
import { createEmptyState } from "@/domain/state";
import { createAppStore } from "./app-store";
import type { SaveStatus } from "./save-status";

let n = 0;
function keys() {
  n += 1;
  return {
    key: `test-${String(n)}`,
    safetyKey: `safety-${String(n)}`,
    upgradeCopyKey: `upgrade-${String(n)}`,
  };
}

function settled(app: ReturnType<typeof createAppStore>): Promise<SaveStatus> {
  return new Promise((resolve) => {
    const check = (s: SaveStatus) => {
      if (s.hydrated || s.loadError !== null) {
        unsubscribe();
        resolve(s);
      }
    };
    const unsubscribe = app.status.subscribe(check);
    check(app.status.getState());
  });
}

/** Lets pending IndexedDB writes finish. */
const flush = () => new Promise((r) => setTimeout(r, 30));

describe("saved store (PRD §11)", () => {
  it("a brand-new install starts empty, and changes survive reopening the app", async () => {
    const k = keys();
    const app = createAppStore(k);
    expect(await settled(app)).toMatchObject({ hydrated: true, loadError: null });
    expect(app.store.getState().data.months).toEqual({});

    app.store.getState().update((d) => ({ ...d, profile: { name: "Sakshi" } }));
    await flush();

    const reopened = createAppStore(k);
    await settled(reopened);
    expect(reopened.store.getState().data.profile.name).toBe("Sakshi");
  });

  it("saves the whole state with its schema version", async () => {
    const k = keys();
    const app = createAppStore(k);
    await settled(app);
    const full = sampleState();
    app.store.getState().update(() => full);
    await flush();
    const raw = await idbGet<{ state: { data: unknown }; version: number }>(k.key);
    expect(raw?.version).toBe(1);
    expect(raw?.state.data).toEqual(full);
  });

  it("ignores changes made before saved data has loaded, so it can't overwrite it", async () => {
    const k = keys();
    const saved = sampleState();
    await idbSet(k.key, { state: { data: saved }, version: 1 });

    const app = createAppStore(k);
    app.store.getState().update(() => createEmptyState(new Date())); // too early
    await settled(app);
    await flush();
    expect(app.store.getState().data).toEqual(saved);
    expect((await idbGet<{ state: { data: unknown } }>(k.key))?.state.data).toEqual(saved);
  });
});

describe("saved data must never be lost", () => {
  it("data from a newer app version is refused and left exactly as it is", async () => {
    const k = keys();
    const newer = {
      state: { data: { ...sampleState(), schemaVersion: 2, futureField: true } },
      version: 2,
    };
    await idbSet(k.key, newer);

    const app = createAppStore(k);
    expect(await settled(app)).toMatchObject({ hydrated: false, loadError: "newer-version" });
    app.store.getState().update((d) => ({ ...d, profile: { name: "Oops" } }));
    app.store.setState({ data: createEmptyState(new Date()) });
    await flush();
    expect(await idbGet(k.key)).toEqual(newer);
  });

  it("damaged data is refused and left exactly as it is", async () => {
    const k = keys();
    const damaged = { state: { data: { schemaVersion: 1, months: "garbage" } }, version: 1 };
    await idbSet(k.key, damaged);

    const app = createAppStore(k);
    expect(await settled(app)).toMatchObject({ loadError: "invalid" });
    app.store.setState({ data: createEmptyState(new Date()) });
    await flush();
    expect(await idbGet(k.key)).toEqual(damaged);
  });
});

describe("restore and undo restore (PRD §8.11)", () => {
  it("keeps a safety copy, and 'Undo restore' brings back exactly what was there", async () => {
    const k = keys();
    const app = createAppStore(k);
    await settled(app);
    const mine = sampleState();
    app.store.getState().update(() => mine);

    const backup = createEmptyState(new Date(2026, 0, 1));
    backup.profile.name = "From backup";
    await app.store.getState().restore(backup);
    expect(app.store.getState().data).toEqual(backup);
    expect((await idbGet<{ state: unknown }>(k.safetyKey))?.state).toEqual(mine);
    await flush();

    // The restore survives reopening the app…
    const reopened = createAppStore(k);
    await settled(reopened);
    expect(reopened.store.getState().data.profile.name).toBe("From backup");

    // …and can be undone
    expect(await reopened.store.getState().undoRestore()).toBe(true);
    expect(reopened.store.getState().data).toEqual(mine);
  });

  it("undo does nothing when there's no safety copy", async () => {
    const app = createAppStore(keys());
    await settled(app);
    const before = app.store.getState().data;
    expect(await app.store.getState().undoRestore()).toBe(false);
    expect(app.store.getState().data).toBe(before);
  });

  it("keeps amounts as exact paise through save and load", async () => {
    const k = keys();
    const app = createAppStore(k);
    await settled(app);
    const state = sampleState();
    const nov = state.months["2026-11"];
    if (nov === undefined) throw new Error("fixture");
    nov.totalBudget = rupees(60_000) + 37;
    app.store.getState().update(() => state);
    await flush();
    const reopened = createAppStore(k);
    await settled(reopened);
    expect(reopened.store.getState().data.months["2026-11"]?.totalBudget).toBe(6_000_037);
  });
});

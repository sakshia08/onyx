import "fake-indexeddb/auto";
import { get as idbGet, set as idbSet } from "idb-keyval";
import { describe, expect, it, vi } from "vitest";
import { createGuardedStorage } from "./guarded-storage";

const failing = vi.hoisted(() => ({ on: false }));

vi.mock("idb-keyval", async (importOriginal) => {
  const actual = await importOriginal<typeof import("idb-keyval")>();
  return {
    ...actual,
    set: (key: IDBValidKey, value: unknown) =>
      failing.on ? Promise.reject(new Error("QuotaExceededError")) : actual.set(key, value),
  };
});

const value = (schemaVersion: number) => ({
  state: { data: { schemaVersion } },
  version: schemaVersion,
});

describe("guarded storage", () => {
  it("writes nothing until allowed", async () => {
    const storage = createGuardedStorage({ upgradeCopyKey: "u1", onSaveResult: () => undefined });
    await storage.setItem("g1", value(1));
    expect(await idbGet("g1")).toBeUndefined();
    storage.allowWrites();
    await storage.setItem("g1", value(1));
    expect(await idbGet("g1")).toEqual(value(1));
  });

  it("PRD §13: a failed save (phone full) is reported, never silently dropped", async () => {
    const results: boolean[] = [];
    const storage = createGuardedStorage({
      upgradeCopyKey: "u2",
      onSaveResult: (ok) => results.push(ok),
    });
    storage.allowWrites();
    failing.on = true;
    await storage.setItem("g2", value(1));
    failing.on = false;
    await storage.setItem("g2", value(1));
    expect(results).toEqual([false, true]);
  });

  it("keeps the raw old data under its own key before an upgrade", async () => {
    await idbSet("g3", value(0));
    const storage = createGuardedStorage({
      upgradeCopyKey: "u3",
      onSaveResult: () => undefined,
      now: () => new Date(2027, 0, 5, 10, 0),
    });
    expect(await storage.getItem("g3")).toEqual(value(0));
    expect(await idbGet("u3")).toEqual({ takenAt: "2027-01-05T10:00:00", value: value(0) });
  });

  it("doesn't make an upgrade copy for current data", async () => {
    await idbSet("g4", value(1));
    const storage = createGuardedStorage({ upgradeCopyKey: "u4", onSaveResult: () => undefined });
    await storage.getItem("g4");
    expect(await idbGet("u4")).toBeUndefined();
  });
});

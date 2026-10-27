import { describe, expect, it } from "vitest";
import {
  backupFilename,
  createBackup,
  isBackupOverdue,
  parseBackup,
  prepareRestore,
  recordBackup,
  undoRestore,
} from "./backup";
import { sampleState } from "./fixtures-state";
import { createEmptyState } from "./state";

const NOW = new Date(2026, 10, 18, 21, 15);

describe("backup files (PRD §8.11)", () => {
  it("are named onyx-backup-YYYY-MM-DD.json", () => {
    expect(backupFilename(NOW)).toBe("onyx-backup-2026-11-18.json");
    expect(createBackup(sampleState(), NOW).filename).toBe("onyx-backup-2026-11-18.json");
  });

  it("AC: back up, erase, restore gives back exactly the same data", () => {
    const original = sampleState();
    const { text } = createBackup(original, NOW);
    const erased = createEmptyState(NOW);
    const parsed = parseBackup(text);
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;
    const { state } = prepareRestore(erased, parsed.state, NOW);
    expect(state).toEqual(original);
  });

  it("shows a preview before restoring", () => {
    const parsed = parseBackup(createBackup(sampleState(), NOW).text);
    expect(parsed.ok && parsed.summary).toEqual({
      months: 2,
      entries: 4,
      piggies: 1,
      since: "2026-10-26T09:28:00",
      exportedAt: "2026-11-18T21:15:00",
    });
  });
});

describe("refusing bad files", () => {
  it("rejects text that isn't JSON", () => {
    expect(parseBackup("not json {")).toEqual({ ok: false, reason: "not-json" });
  });

  it("rejects JSON that isn't an Onyx backup", () => {
    expect(parseBackup(JSON.stringify({ hello: "world" }))).toEqual({
      ok: false,
      reason: "not-a-backup",
    });
  });

  it("PRD §13: refuses a backup from a newer app version", () => {
    const file = JSON.parse(createBackup(sampleState(), NOW).text) as {
      data: { schemaVersion: number };
    };
    file.data.schemaVersion = 2;
    expect(parseBackup(JSON.stringify(file))).toEqual({ ok: false, reason: "newer-version" });
  });

  it("rejects damaged data, e.g. money that isn't whole paise", () => {
    const state = sampleState();
    const nov = state.months["2026-11"];
    if (nov === undefined) throw new Error("fixture");
    const broken = {
      ...state,
      months: { ...state.months, "2026-11": { ...nov, totalBudget: 12.5 } },
    };
    expect(parseBackup(createBackup(broken, NOW).text)).toEqual({ ok: false, reason: "invalid" });
  });
});

describe("safety copy and undo restore", () => {
  it("AC: 'Undo restore' gives back exactly the data from before the restore", () => {
    const before = sampleState();
    const snapshot = structuredClone(before);
    const incoming = createEmptyState(NOW);
    const { state, safetyCopy } = prepareRestore(before, incoming, NOW);
    expect(state).toEqual(incoming);
    expect(undoRestore(safetyCopy)).toEqual(snapshot);
  });

  it("the safety copy can't be changed by later edits", () => {
    const before = sampleState();
    const { safetyCopy } = prepareRestore(before, createEmptyState(NOW), NOW);
    before.profile.name = "Changed";
    expect(undoRestore(safetyCopy).profile.name).toBe("Sakshi");
  });
});

describe("backup status", () => {
  it("PRD §13: a cancelled share doesn't change the last backup date (it's only recorded on success)", () => {
    const state = sampleState();
    expect(state.meta.lastBackupAt).toBe("2026-11-01T08:02:00");
    expect(recordBackup(state, NOW).meta.lastBackupAt).toBe("2026-11-18T21:15:00");
  });

  it("is amber after more than 35 days, or when there's never been a backup", () => {
    expect(isBackupOverdue(undefined, NOW)).toBe(true);
    expect(isBackupOverdue("2026-10-14T10:00:00", NOW)).toBe(false); // 35 days
    expect(isBackupOverdue("2026-10-13T10:00:00", NOW)).toBe(true); // 36 days
  });
});

import { describe, expect, it } from "vitest";
import { rupees } from "./money";
import { bucketForNote, favoriteKey, noteSuggestions, shouldSuggestFavorite } from "./suggestions";
import { entry } from "./testing";

const at = (day: number, hour = 12) =>
  `2026-11-${String(day).padStart(2, "0")}T${String(hour).padStart(2, "0")}:00:00`;

describe("note suggestions (PRD §8.4)", () => {
  const entries = [
    entry("food", rupees(180), { note: "Dosa", date: at(1) }),
    entry("food", rupees(180), { note: "dosa", date: at(2) }),
    entry("food", rupees(60), { note: "Coffee", date: at(3) }),
    entry("food", rupees(60), { note: "Coffee", date: at(4) }),
    entry("food", rupees(60), { note: "Coffee", date: at(5) }),
    entry("food", rupees(250), { note: "Masala dosa", date: at(9) }),
    entry("commute", rupees(40), { note: "Metro", date: at(6) }),
    entry("commute", rupees(250), { note: "Uber", date: at(7) }),
  ];

  it("matches case-insensitively, prefix matches first", () => {
    expect(noteSuggestions(entries, "DO")).toEqual(["dosa", "Masala dosa"]);
  });

  it("ranks by how often, then how recently", () => {
    const c = [
      entry("food", rupees(20), { note: "Chai", date: at(1) }),
      entry("food", rupees(60), { note: "Coffee", date: at(2) }),
      entry("food", rupees(60), { note: "Coffee", date: at(3) }),
      entry("food", rupees(90), { note: "Cake", date: at(4) }),
    ];
    // Coffee twice; Cake and Chai once each, Cake more recently
    expect(noteSuggestions(c, "c")).toEqual(["Coffee", "Cake", "Chai"]);
  });

  it("shows at most 3", () => {
    expect(noteSuggestions(entries, "o")).toHaveLength(3);
  });

  it("with a bucket chosen and the note empty, shows that bucket's most common notes", () => {
    expect(noteSuggestions(entries, "", "food")).toEqual(["Coffee", "dosa", "Masala dosa"]);
    expect(noteSuggestions(entries, "", "commute")).toEqual(["Uber", "Metro"]);
    expect(noteSuggestions(entries, "")).toEqual([]);
  });

  it("doesn't suggest exactly what's already typed", () => {
    expect(noteSuggestions(entries, "coffee")).toEqual([]);
  });

  it("picks the bucket a note is most often logged in", () => {
    const mixed = [
      ...entries,
      entry("leisure", rupees(250), { note: "uber", date: at(11) }),
      entry("commute", rupees(250), { note: "Uber", date: at(12) }),
    ];
    expect(bucketForNote(mixed, "UBER")).toBe("commute");
    expect(bucketForNote(mixed, "nothing")).toBeNull();
  });
});

describe("'Save as favorite?' (PRD §8.4)", () => {
  const metro = (day: number) => entry("commute", rupees(40), { note: "Metro", date: at(day) });
  const latest = {
    note: "Metro",
    amount: rupees(40),
    bucketId: "commute",
    type: "expense" as const,
  };

  it("asks after the same note, amount and bucket 3 times within 30 days", () => {
    expect(shouldSuggestFavorite([metro(1), metro(2)], latest, "2026-11-02", [], [])).toBe(false);
    expect(
      shouldSuggestFavorite([metro(1), metro(2), metro(3)], latest, "2026-11-03", [], []),
    ).toBe(true);
  });

  it("doesn't count entries older than 30 days", () => {
    const old = entry("commute", rupees(40), { note: "Metro", date: "2026-10-01T09:00:00" });
    expect(shouldSuggestFavorite([old, metro(2), metro(3)], latest, "2026-11-03", [], [])).toBe(
      false,
    );
  });

  it("never asks again once dismissed, or if it's already a favorite", () => {
    const three = [metro(1), metro(2), metro(3)];
    const key = favoriteKey("Metro", rupees(40), "commute");
    expect(shouldSuggestFavorite(three, latest, "2026-11-03", [], [key])).toBe(false);
    const fav = { id: "f", label: "metro", amount: rupees(40), bucketId: "commute", order: 0 };
    expect(shouldSuggestFavorite(three, latest, "2026-11-03", [fav], [])).toBe(false);
  });

  it("needs a note and an expense", () => {
    expect(shouldSuggestFavorite([], { ...latest, note: "" }, "2026-11-03", [], [])).toBe(false);
    expect(shouldSuggestFavorite([], { ...latest, type: "refund" }, "2026-11-03", [], [])).toBe(
      false,
    );
  });
});

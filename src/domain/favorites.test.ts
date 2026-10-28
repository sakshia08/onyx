import { describe, expect, it } from "vitest";
import { entryFromFavorite, favoriteFromEntry, usableFavorites } from "./favorites";
import { rupees } from "./money";
import { november } from "./testing";

describe("favorites (PRD §8.4)", () => {
  it("are made from an entry's note, amount and bucket", () => {
    expect(
      favoriteFromEntry(
        { note: " Metro ", amount: rupees(40), bucketId: "commute" },
        "🚇",
        "f1",
        0,
      ),
    ).toEqual({
      id: "f1",
      label: "Metro",
      emoji: "🚇",
      amount: rupees(40),
      bucketId: "commute",
      order: 0,
    });
  });

  it("log as an expense from 'favorite', now", () => {
    const fav = { id: "f1", label: "Metro", amount: rupees(40), bucketId: "commute", order: 0 };
    expect(entryFromFavorite(fav, "e1", "2026-11-18T09:10:00")).toEqual({
      id: "e1",
      type: "expense",
      bucketId: "commute",
      amount: rupees(40),
      note: "Metro",
      date: "2026-11-18T09:10:00",
      createdAt: "2026-11-18T09:10:00",
      source: "favorite",
    });
  });

  it("hide favorites whose bucket isn't in this month, and keep their order", () => {
    const favs = [
      { id: "b", label: "Lunch", amount: 1, bucketId: "food", order: 2 },
      { id: "a", label: "Metro", amount: 1, bucketId: "commute", order: 1 },
      { id: "c", label: "Vet", amount: 1, bucketId: "pets", order: 0 },
    ];
    expect(usableFavorites(favs, november()).map((f) => f.id)).toEqual(["a", "b"]);
  });
});

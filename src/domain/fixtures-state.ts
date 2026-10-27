/** A full, realistic saved state for backup and migration tests. Used only by tests. */

import { rupees } from "./money";
import { createEmptyState } from "./state";
import { entry, goaTrip, november, rule, txn } from "./testing";
import type { AppState } from "./types";

export function sampleState(): AppState {
  const empty = createEmptyState(new Date(2026, 9, 26, 9, 28));
  const october = {
    ...november({ entries: [entry("food", rupees(6_100), { date: "2026-10-20T13:00:00" })] }),
    key: "2026-10",
    status: "closed" as const,
    closedAt: "2026-11-01T08:00:00",
    recapSeenAt: "2026-11-01T08:01:00",
  };
  const nov = november({
    entries: [
      entry("food", rupees(180) + 50, { note: "Dosa and filter coffee" }),
      entry("food", rupees(400), { type: "refund", note: "Rahul paid me back" }),
      entry("leisure", rupees(649), { source: "recurring", recurringRuleId: "netflix" }),
    ],
    recurringLog: [{ ruleId: "netflix", status: "logged", entryId: "x" }],
    alertsShown: [{ bucketId: "food", threshold: 80 }],
  });
  return {
    ...empty,
    profile: { name: "Sakshi" },
    activeMonthKey: "2026-11",
    months: { "2026-10": october, "2026-11": nov },
    piggies: [
      goaTrip({
        transactions: [
          txn("opening", rupees(2_000), "2026-11-01T09:00:00"),
          txn("leftover", rupees(1_000), "2026-11-01T09:05:00", "2026-10"),
          txn("stash", rupees(6_000), "2026-11-05T21:00:00"),
        ],
      }),
    ],
    recurring: [rule()],
    favorites: [
      { id: "fav", label: "Metro", emoji: "🚇", amount: rupees(40), bucketId: "commute", order: 0 },
    ],
    meta: {
      ...empty.meta,
      lastBackupAt: "2026-11-01T08:02:00",
      dismissedFavoriteSuggestions: ["uber|25000|commute"],
    },
  };
}

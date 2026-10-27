import { dayInMonth, isoForDay, monthKeyOfDate, toISODate } from "@/domain/dates";
import { rupees, type Paise } from "@/domain/money";
import { createEmptyState } from "@/domain/state";
import type { AppState, Bucket, Entry } from "@/domain/types";
import { newId } from "@/lib/id";

/** Dev only: a realistic month for trying screens before Quick add exists. */
export function sampleAppState(now: Date): AppState {
  const key = monthKeyOfDate(now);
  const today = dayInMonth(key, now);
  const bucket = (
    id: string,
    name: string,
    emoji: string,
    color: Bucket["color"],
    kind: Bucket["kind"],
    allocated: Paise,
    order: number,
  ): Bucket => ({
    id,
    name,
    emoji,
    color,
    kind,
    allocated,
    order,
  });
  const buckets: Bucket[] = [
    bucket("food", "Food", "🍜", "orange", "spend", rupees(8_000), 0),
    bucket("commute", "Commute", "🚇", "blue", "spend", rupees(3_000), 1),
    bucket("leisure", "Leisure", "🎉", "rose", "spend", rupees(2_000), 2),
    bucket("groceries", "Groceries", "🛒", "amber", "spend", 0, 3),
    bucket("investing", "Investing", "📈", "green", "save", rupees(15_000), 4),
    bucket("saving", "Saving", "🏦", "teal", "save", rupees(25_000), 5),
  ];
  const entry = (
    bucketId: string,
    amount: Paise,
    daysAgo: number,
    time: [number, number],
    note?: string,
    type: Entry["type"] = "expense",
  ): Entry => {
    const date = isoForDay(key, Math.max(1, today - daysAgo), time[0], time[1]);
    return {
      id: newId(),
      type,
      bucketId,
      amount,
      date,
      createdAt: date,
      source: "manual",
      ...(note ? { note } : {}),
    };
  };
  const entries: Entry[] = [
    entry("food", rupees(180) + 50, 0, [13, 42], "Dosa and filter coffee"),
    entry("commute", rupees(40), 0, [9, 10], "Metro"),
    entry("food", rupees(400), 0, [8, 55], "Rahul paid me back", "refund"),
    entry("leisure", rupees(649), 1, [9, 0], "Netflix"),
    entry("food", rupees(1_250), 1, [20, 30], "Dinner with friends"),
    entry("commute", rupees(2_410), 3, [18, 5], "Uber rides"),
    entry("food", rupees(4_169) + 50, 6, [12, 0], "Groceries and eating out"),
    entry("leisure", rupees(1_851), 4, [21, 0], "Concert tickets"),
    entry("investing", rupees(10_000), 10, [10, 0], "SIP"),
    entry("saving", rupees(26_000), 12, [10, 30], "Fixed deposit"),
  ];
  const empty = createEmptyState(now);
  return {
    ...empty,
    profile: { name: "Sakshi" },
    activeMonthKey: key,
    months: {
      [key]: {
        key,
        status: "active",
        totalBudget: rupees(60_000),
        buckets,
        piggyPlans: [],
        entries,
        recurringLog: [],
        alertsShown: [],
        createdAt: toISODate(now),
      },
    },
  };
}

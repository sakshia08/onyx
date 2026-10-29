import { addMonths } from "date-fns";
import {
  dayInMonth,
  dayKeyOfDate,
  isoForDay,
  monthKeyOfDate,
  previousMonthKey,
  toISODate,
} from "@/domain/dates";
import { rupees, type Paise } from "@/domain/money";
import { createEmptyState } from "@/domain/state";
import type { AppState, Bucket, Entry, Piggy, PiggyTxn, RecurringRule } from "@/domain/types";
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
    entry("leisure", rupees(649), 1, [9, 0], "Spotify"),
    entry("food", rupees(1_250), 1, [20, 30], "Dinner with friends"),
    entry("commute", rupees(2_410), 3, [18, 5], "Uber rides"),
    entry("food", rupees(4_169) + 50, 6, [12, 0], "Groceries and eating out"),
    entry("leisure", rupees(1_851), 4, [21, 0], "Concert tickets"),
    {
      ...entry("investing", rupees(10_000), 10, [10, 0], "SIP"),
      source: "recurring",
      recurringRuleId: "sip",
    },
    entry("saving", rupees(26_000), 12, [10, 30], "Fixed deposit"),
  ];
  const empty = createEmptyState(now);
  const rule = (
    id: string,
    name: string,
    amount: Paise,
    bucketId: string,
    dayOfMonth: number,
    mode: RecurringRule["mode"],
  ): RecurringRule => ({
    id,
    name,
    amount,
    bucketId,
    dayOfMonth,
    mode,
    active: true,
    createdAt: toISODate(now),
  });
  // Piggies saved into last month, so this month's numbers are only the entries above
  const last = previousMonthKey(key);
  const at = (monthKey: string, day: number) => isoForDay(monthKey, day, 10, 0);
  const t = (type: PiggyTxn["type"], amount: Paise, date: string): PiggyTxn => ({
    id: newId(),
    type,
    amount,
    date,
    monthKey: date.slice(0, 7),
    createdAt: date,
  });
  const inMonths = (n: number) => dayKeyOfDate(addMonths(now, n));
  const piggies: Piggy[] = [
    {
      id: "goa",
      name: "Goa trip",
      emoji: "🌴",
      target: rupees(30_000),
      targetDate: inMonths(4),
      repeat: "none",
      autoStash: false,
      status: "active",
      createdAt: at(last, 1),
      transactions: [
        t("opening", rupees(6_000), at(last, 1)),
        t("stash", rupees(12_600), at(last, 5)),
      ],
    },
    {
      id: "insurance",
      name: "Insurance",
      emoji: "🛡️",
      target: rupees(12_000),
      targetDate: inMonths(2),
      repeat: "yearly",
      autoStash: false,
      status: "active",
      createdAt: at(last, 2),
      transactions: [t("stash", rupees(8_000), at(last, 2))],
    },
    {
      id: "phone",
      name: "New phone",
      emoji: "📱",
      target: rupees(80_000),
      repeat: "none",
      autoStash: false,
      status: "active",
      createdAt: at(last, 3),
      transactions: [t("opening", rupees(5_000), at(last, 3))],
    },
  ];
  return {
    ...empty,
    profile: { name: "Sakshi" },
    piggies,
    recurring: [
      rule("sip", "SIP", rupees(10_000), "investing", 5, "auto"),
      rule("phone-bill", "Phone bill", rupees(599), "leisure", 15, "ask"),
      rule("netflix", "Netflix", rupees(649), "leisure", 28, "auto"),
    ],
    activeMonthKey: key,
    months: {
      [key]: {
        key,
        status: "active",
        totalBudget: rupees(60_000),
        buckets,
        piggyPlans: [{ piggyId: "goa", planned: rupees(2_900) }],
        entries,
        recurringLog: [{ ruleId: "sip", status: "logged" }],
        alertsShown: [],
        createdAt: toISODate(now),
      },
    },
  };
}

/** Dev only: last month closed, piggies saved, and no active month: opens setup with piggies. */
export function sampleBeforeSetup(now: Date): AppState {
  const state = sampleAppState(now);
  const key = monthKeyOfDate(now);
  const current = state.months[key];
  if (!current) return state;
  const last = previousMonthKey(key);
  return {
    ...state,
    activeMonthKey: null,
    months: { [last]: { ...current, key: last, status: "closed", entries: [], piggyPlans: [] } },
  };
}

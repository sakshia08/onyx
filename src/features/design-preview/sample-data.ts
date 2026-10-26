import type { BucketColor } from "@/domain/bucket-colors";
import type { BucketKind } from "@/domain/budget";
import { rupees, type Paise } from "@/domain/money";

/** Sample numbers for the design preview: 18 November 2026, using the PRD §7.5 setup. */
export const SAMPLE_DAY = { today: 18, daysInMonth: 30 } as const;

export interface SampleBucket {
  name: string;
  emoji: string;
  color: BucketColor;
  kind: BucketKind;
  allocated: Paise;
  used: Paise;
}

export const SAMPLE_BUCKETS: SampleBucket[] = [
  {
    name: "Food",
    emoji: "🍜",
    color: "orange",
    kind: "spend",
    allocated: rupees(8000),
    used: rupees(5200),
  },
  {
    name: "Commute",
    emoji: "🚇",
    color: "blue",
    kind: "spend",
    allocated: rupees(3000),
    used: rupees(2450),
  },
  {
    name: "Leisure",
    emoji: "🎉",
    color: "rose",
    kind: "spend",
    allocated: rupees(2000),
    used: rupees(2500),
  },
  {
    name: "Groceries",
    emoji: "🛒",
    color: "amber",
    kind: "spend",
    allocated: rupees(0),
    used: rupees(0),
  },
  {
    name: "Investing",
    emoji: "📈",
    color: "green",
    kind: "save",
    allocated: rupees(15000),
    used: rupees(10000),
  },
  {
    name: "Saving",
    emoji: "🏦",
    color: "teal",
    kind: "save",
    allocated: rupees(25000),
    used: rupees(26000),
  },
];

export interface SampleEntry {
  emoji: string;
  color: BucketColor;
  title: string;
  detail: string;
  amount: Paise;
  type: "expense" | "refund";
  piggy?: boolean;
}

export const SAMPLE_DAYS: { label: string; total: Paise; entries: SampleEntry[] }[] = [
  {
    label: "Today",
    total: rupees(220) + 50,
    entries: [
      {
        emoji: "🍜",
        color: "orange",
        title: "Dosa and filter coffee",
        detail: "13:42 · Food",
        amount: rupees(180) + 50,
        type: "expense",
      },
      {
        emoji: "🚇",
        color: "blue",
        title: "Metro",
        detail: "09:10 · Commute",
        amount: rupees(40),
        type: "expense",
      },
      {
        emoji: "🍜",
        color: "orange",
        title: "Rahul paid me back",
        detail: "08:55 · Food · Money back",
        amount: rupees(400),
        type: "refund",
      },
    ],
  },
  {
    label: "Yesterday",
    total: rupees(2649),
    entries: [
      {
        emoji: "🌴",
        color: "rose",
        title: "Goa trip",
        detail: "21:05 · Stashed into piggy",
        amount: rupees(2000),
        type: "expense",
        piggy: true,
      },
      {
        emoji: "🎉",
        color: "rose",
        title: "Netflix",
        detail: "09:00 · Leisure · Recurring",
        amount: rupees(649),
        type: "expense",
      },
    ],
  },
];

/** The month as a whole, for the tank. */
export const SAMPLE_MONTH = {
  name: "November",
  budget: rupees(60_000),
  used: rupees(26_550),
  daysLeft: SAMPLE_DAY.daysInMonth - SAMPLE_DAY.today,
} as const;

export const SAMPLE_PIGGY = {
  name: "Goa trip",
  emoji: "🌴",
  saved: rupees(18_600),
  target: rupees(30_000),
  daysLeft: 47,
} as const;

export const SAMPLE_FAVORITES = [
  { emoji: "☕", label: "Coffee", amount: rupees(120) },
  { emoji: "🚇", label: "Metro", amount: rupees(40) },
  { emoji: "🍱", label: "Lunch", amount: rupees(250) },
] as const;

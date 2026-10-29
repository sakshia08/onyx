import { shownAmount } from "@/lib/shown-amount";

import type { PiggyStatus } from "@/domain/piggy";

/** The status pill (PRD §8.6): On track, Behind by ₹2,000, Done 🎉 or Date passed. */
export function statusLabel(status: PiggyStatus): {
  text: string;
  tone: "good" | "warn" | "plain";
} {
  switch (status.kind) {
    case "done":
      return { text: "Done 🎉", tone: "good" };
    case "on-track":
      return { text: "On track", tone: "good" };
    case "behind":
      return { text: `Behind by ${shownAmount(status.by)}`, tone: "warn" };
    case "date-passed":
      return { text: "Date passed", tone: "warn" };
    case "no-date":
      return { text: "No date", tone: "plain" };
  }
}

/** "47 days left", "Due today", "Date passed", or "" without a date. */
export function countdown(days: number | null): string {
  if (days === null) return "";
  if (days < 0) return "Date passed";
  if (days === 0) return "Due today";
  return `${String(days)} ${days === 1 ? "day" : "days"} left`;
}

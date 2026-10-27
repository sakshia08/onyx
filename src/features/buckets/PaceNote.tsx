import { CalendarClock } from "lucide-react";
import { Amount } from "@/components/Amount";
import { bucketStatus, usedFraction } from "@/domain/budget";
import { monthName } from "@/domain/dates";
import type { Paise } from "@/domain/money";
import type { Bucket, MonthKey } from "@/domain/types";
import { cn } from "@/lib/cn";

interface PaceNoteProps {
  bucket: Bucket;
  used: Paise;
  today: number;
  days: number;
  monthKey: MonthKey;
  /** Recurring expenses still to come this month (PRD §7.2). */
  upcoming: Paise;
  className?: string;
}

/**
 * The pace in words, under the tank. Percentages only, never a per-day amount (PRD §7.2).
 * Calm, not naggy (PRD §3).
 */
export function PaceNote({
  bucket,
  used,
  today,
  days,
  monthKey,
  upcoming,
  className,
}: PaceNoteProps) {
  const status = bucketStatus(bucket.kind, bucket.allocated, used, today, days);
  const usedPct = Math.round(usedFraction(bucket.allocated, used) * 100);
  const gonePct = Math.round((today / days) * 100);
  const month = monthName(monthKey);

  let text: React.ReactNode;
  let tone = "text-text-2";
  if (status.kind === "spend") {
    if (status.state === "over") {
      tone = "text-negative";
      text = (
        <>
          Over by <Amount value={-status.remaining} size="callout" tone="inherit" />. Money back
          into {bucket.name} brings it back up.
        </>
      );
    } else if (bucket.allocated === 0) {
      text = "₹0 budget. Any spending here shows as over.";
    } else if (status.state === "ahead") {
      tone = "text-warning";
      text = `Ahead of pace: ${String(usedPct)}% used, with ${String(gonePct)}% of ${month} gone.`;
    } else {
      text = `On pace: ${String(usedPct)}% used, with ${String(gonePct)}% of ${month} gone.`;
    }
  } else if (status.state === "left") {
    text = (
      <>
        <Amount value={status.remaining} size="callout" tone="inherit" /> left to put away this
        month.
      </>
    );
  } else if (status.state === "done") {
    text = "All put away for this month.";
  } else {
    text = (
      <>
        <Amount value={-status.remaining} size="callout" tone="inherit" /> extra put away. Nice.
      </>
    );
  }

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <p className={cn("text-callout", tone)}>{text}</p>
      {upcoming > 0 && (
        <p className="flex items-center gap-2 text-callout text-text-2">
          <CalendarClock aria-hidden="true" className="size-4 shrink-0" />
          <span>
            <Amount value={upcoming} size="callout" tone="inherit" /> still coming up from recurring
            expenses.
          </span>
        </p>
      )}
    </div>
  );
}

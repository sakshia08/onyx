import { CalendarDays } from "lucide-react";
import { spokenAmount, type Paise } from "@/domain/money";
import { cn } from "@/lib/cn";
import { Amount } from "./Amount";
import { ProgressBar } from "./ProgressBar";

interface HeroCardProps {
  remaining: Paise;
  totalBudget: Paise;
  used: Paise;
  daysLeft: number;
  className?: string;
}

/** Home's hero (PRD §8.3): aurora gradient, "Left this month", used and days left. */
export function HeroCard({ remaining, totalBudget, used, daysLeft, className }: HeroCardProps) {
  const over = remaining < 0;
  return (
    <section
      aria-label="This month"
      className={cn("aurora grain rounded-card border border-hairline-strong p-5", className)}
    >
      <div aria-hidden="true" className="aurora-mesh" />
      <div aria-hidden="true" className="aurora-shade" />

      <p className="micro-label text-text-1/80">Left this month</p>
      <Amount
        value={remaining}
        size="display"
        animated
        className="mt-2"
        {...(over ? { label: `Over budget by ${spokenAmount(-remaining)}` } : {})}
      />
      <p className="mt-1 text-callout text-text-1/80">
        of <Amount value={totalBudget} size="callout" tone="inherit" className="font-normal" /> ·{" "}
        <Amount value={used} size="callout" tone="inherit" className="font-normal" /> used
      </p>

      <ProgressBar
        className="mt-5"
        size="thin"
        onAurora
        value={totalBudget > 0 ? used / totalBudget : 0}
        color="var(--text-1)"
        over={over}
        label="Budget used this month"
      />

      <div className="mt-4 flex items-center gap-1.5 text-caption text-text-1/80">
        <CalendarDays aria-hidden="true" className="size-4" strokeWidth={2} />
        <span>
          {daysLeft} {daysLeft === 1 ? "day" : "days"} left
        </span>
      </div>
    </section>
  );
}

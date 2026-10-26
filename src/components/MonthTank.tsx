import { spokenAmount, type Paise } from "@/domain/money";
import { cn } from "@/lib/cn";
import { Amount } from "./Amount";
import { LiquidFill } from "./LiquidFill";

interface MonthTankProps {
  remaining: Paise;
  totalBudget: Paise;
  used: Paise;
  daysLeft: number;
  className?: string;
}

/**
 * Home's hero (PRD §8.3): the month as a tank of liquid that drains as money is used.
 * Over budget, the tank is empty, the number is red and the edge glows red.
 */
export function MonthTank({ remaining, totalBudget, used, daysLeft, className }: MonthTankProps) {
  const over = remaining < 0;
  const level = totalBudget > 0 ? Math.max(0, remaining) / totalBudget : 0;

  return (
    <section
      aria-label="This month"
      className={cn(
        "grain relative h-[272px] overflow-hidden rounded-tank border bg-surface-1",
        over ? "border-negative/45" : "border-hairline",
        className,
      )}
    >
      <LiquidFill
        level={level}
        color="var(--liquid)"
        strength={62}
        width={350}
        height={272}
        amplitude={5}
        wavelength={110}
      />
      <div className="relative flex h-full flex-col p-6">
        <div className="flex items-center justify-between gap-3">
          <p className="micro-label">Left this month</p>
          <span className="-my-1.5 shrink-0 rounded-pill bg-text-1/10 px-3 py-1.5 text-caption text-text-1">
            {daysLeft} {daysLeft === 1 ? "day" : "days"} left
          </span>
        </div>
        <Amount
          value={remaining}
          size="hero"
          animated
          className="mt-2"
          {...(over ? { label: `Over budget by ${spokenAmount(-remaining)}` } : {})}
        />
        <p className="mt-auto text-callout text-text-1">
          <Amount value={used} size="callout" tone="inherit" className="font-normal" /> used of{" "}
          <Amount value={totalBudget} size="callout" tone="inherit" className="font-normal" />
        </p>
      </div>
    </section>
  );
}

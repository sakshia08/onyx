import { spokenAmount, type Paise } from "@/domain/money";
import { Amount } from "./Amount";
import { Tank, TankPill } from "./Tank";

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
  return (
    <Tank
      label="This month"
      level={totalBudget > 0 ? Math.max(0, remaining) / totalBudget : 0}
      color="var(--liquid)"
      over={over}
      {...(className !== undefined ? { className } : {})}
      header={
        <>
          <p className="micro-label text-text-1/85">Left this month</p>
          <TankPill>
            {daysLeft} {daysLeft === 1 ? "day" : "days"} left
          </TankPill>
        </>
      }
      footer={
        <p className="text-callout text-text-1">
          <Amount value={used} size="callout" tone="inherit" className="font-normal" /> used of{" "}
          <Amount value={totalBudget} size="callout" tone="inherit" className="font-normal" />
        </p>
      }
    >
      <Amount
        value={remaining}
        size="hero"
        animated
        className="mt-2"
        {...(over ? { label: `Over budget by ${spokenAmount(-remaining)}` } : {})}
      />
    </Tank>
  );
}

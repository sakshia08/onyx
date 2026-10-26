import { motion } from "motion/react";
import type { BucketColor } from "@/domain/bucket-colors";
import { bucketStatus, usedFraction, type BucketKind } from "@/domain/budget";
import { formatAmount, spokenAmount, type Paise } from "@/domain/money";
import { tapScale } from "@/lib/motion";
import { cn } from "@/lib/cn";
import { Amount } from "./Amount";
import { bucketColorVar, bucketTint } from "./bucket-color";
import { ProgressBar } from "./ProgressBar";

interface BucketCardProps {
  name: string;
  emoji: string;
  color: BucketColor;
  kind: BucketKind;
  allocated: Paise;
  used: Paise;
  today: number;
  daysInMonth: number;
  onClick?: () => void;
  className?: string;
}

/** A bucket on Home (PRD §8.3): what's left, a sub-line and a progress bar with pace tick. */
export function BucketCard({
  name,
  emoji,
  color,
  kind,
  allocated,
  used,
  today,
  daysInMonth,
  onClick,
  className,
}: BucketCardProps) {
  const status = bucketStatus(kind, allocated, used, today, daysInMonth);
  const over = status.kind === "spend" && status.state === "over";
  const ahead = status.kind === "spend" && status.state === "ahead";
  const extra = status.kind === "save" && status.state === "extra";

  return (
    <motion.button
      type="button"
      whileTap={tapScale}
      onClick={onClick}
      className={cn(
        "flex w-full min-w-0 flex-col rounded-card border border-hairline bg-surface-1 p-4 text-left",
        className,
      )}
    >
      <div className="flex w-full items-start justify-between">
        <span
          aria-hidden="true"
          className="grid size-10 place-items-center rounded-inner text-[20px] leading-none"
          style={{ backgroundColor: bucketTint(color) }}
        >
          {emoji}
        </span>
        {ahead && (
          <span className="mt-1 flex items-center gap-1.5 text-caption text-warning">
            <span aria-hidden="true" className="size-2 rounded-pill bg-warning" />
            <span className="sr-only">Ahead of pace</span>
          </span>
        )}
      </div>

      <span className="mt-4 truncate text-callout text-text-2">{name}</span>
      <Amount
        value={extra ? -status.remaining : status.remaining}
        size="title"
        tone={over ? "negative" : "default"}
        signDisplay={extra ? "always" : "auto"}
        animated
        className="mt-0.5"
        {...(over ? { label: `Over by ${spokenAmount(-status.remaining)}` } : {})}
      />
      <span className={cn("mt-0.5 truncate text-caption", over ? "text-negative" : "text-text-3")}>
        {subLine(status, allocated)}
      </span>

      <ProgressBar
        className="mt-4 w-full"
        value={usedFraction(allocated, used)}
        {...(kind === "spend" ? { paceTick: today / daysInMonth } : {})}
        color={bucketColorVar(color)}
        over={over}
        label={`${name}: ${Math.round(usedFraction(allocated, used) * 100)}% used`}
      />
    </motion.button>
  );
}

function subLine(status: ReturnType<typeof bucketStatus>, allocated: Paise): string {
  if (status.kind === "spend") {
    if (status.state === "over") return `Over by ${formatAmount(-status.remaining)}`;
    return `of ${formatAmount(allocated)}`;
  }
  if (status.state === "left") return "left to put away";
  if (status.state === "done") return "All put away";
  return "extra put away";
}

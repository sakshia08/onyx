import { motion } from "motion/react";
import type { BucketColor } from "@/domain/bucket-colors";
import { spokenAmount, type Paise } from "@/domain/money";
import { cn } from "@/lib/cn";
import { Amount } from "./Amount";
import { bucketTint } from "./bucket-color";
import { PigIcon } from "./PigIcon";

interface EntryRowProps {
  emoji: string;
  color: BucketColor;
  title: string;
  /** e.g. "14:32 · Food" */
  detail: string;
  amount: Paise;
  type: "expense" | "refund";
  /** Shows a small pig badge (piggy stashes and spends, PRD §8.5). */
  piggy?: boolean;
  onClick?: () => void;
  className?: string;
}

/** One logged item (PRD §8.5). Expenses are normal text; money back is green. */
export function EntryRow({
  emoji,
  color,
  title,
  detail,
  amount,
  type,
  piggy = false,
  onClick,
  className,
}: EntryRowProps) {
  const isRefund = type === "refund";
  return (
    <motion.button
      type="button"
      onClick={onClick}
      whileTap={{ backgroundColor: "var(--surface-2)" }}
      className={cn(
        "flex min-h-16 w-full items-center gap-3 rounded-inner px-2 py-2.5 text-left",
        className,
      )}
    >
      <span
        aria-hidden="true"
        className="relative grid size-11 shrink-0 place-items-center rounded-pill text-[20px] leading-none"
        style={{ backgroundColor: bucketTint(color) }}
      >
        {emoji}
        {piggy && (
          <span className="absolute -right-0.5 -bottom-0.5 grid size-5 place-items-center rounded-pill border-2 border-bg bg-piggy text-bg">
            <PigIcon className="size-3" strokeWidth={2.4} />
          </span>
        )}
      </span>
      <span className="flex min-w-0 flex-1 flex-col">
        <span className="truncate text-body text-text-1">{title}</span>
        <span className="truncate text-caption text-text-3">{detail}</span>
      </span>
      <Amount
        value={isRefund ? amount : -amount}
        size="body"
        signDisplay="always"
        tone={isRefund ? "positive" : "default"}
        className="font-semibold"
        label={`${isRefund ? "Money back" : "Spent"} ${spokenAmount(amount)}`}
      />
    </motion.button>
  );
}

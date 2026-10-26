import { motion } from "motion/react";
import type { BucketColor } from "@/domain/bucket-colors";
import { bucketStatus, usedFraction, type BucketKind } from "@/domain/budget";
import { spokenAmount, type Paise } from "@/domain/money";
import { tapScale } from "@/lib/motion";
import { cn } from "@/lib/cn";
import { Amount } from "./Amount";
import { bucketColorVar } from "./bucket-color";
import { LiquidFill } from "./LiquidFill";

interface BucketVialProps {
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

/**
 * A bucket on Home (PRD §8.3), drawn as a vial of liquid in the bucket's color.
 * Spend vials drain as money is used; save vials fill up as money is put away.
 * The small notch on the right edge is the pace mark: where the level "should" be today.
 */
export function BucketVial({
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
}: BucketVialProps) {
  const status = bucketStatus(kind, allocated, used, today, daysInMonth);
  const over = status.kind === "spend" && status.state === "over";
  const ahead = status.kind === "spend" && status.state === "ahead";
  const extra = status.kind === "save" && status.state === "extra";
  const spentShare = usedFraction(allocated, used);
  const level = kind === "spend" ? 1 - spentShare : spentShare;
  const showPace = kind === "spend" && allocated > 0 && !over;

  return (
    <motion.button
      type="button"
      whileTap={tapScale}
      onClick={onClick}
      className={cn(
        "relative h-[184px] w-full min-w-0 overflow-hidden rounded-vial border bg-surface-1 text-left",
        over ? "border-negative/45" : "border-hairline",
        className,
      )}
    >
      <LiquidFill
        level={allocated > 0 ? level : 0}
        color={bucketColorVar(color)}
        strength={78}
        width={110}
        height={184}
        amplitude={3}
        wavelength={56}
      />
      {showPace && (
        <span
          aria-hidden="true"
          className="absolute right-0 h-0.5 w-2.5 rounded-l-pill bg-text-1/45"
          style={{ bottom: `${(1 - today / daysInMonth) * 100}%` }}
        />
      )}

      <span className="relative flex h-full flex-col p-3.5">
        <span className="flex items-start justify-between">
          <span aria-hidden="true" className="text-[22px] leading-none">
            {emoji}
          </span>
          {ahead && (
            <span className="size-2 rounded-pill bg-warning">
              <span className="sr-only">Ahead of pace</span>
            </span>
          )}
        </span>

        <span className="mt-auto flex min-w-0 flex-col">
          <span className="truncate text-caption text-text-1">{name}</span>
          <Amount
            value={extra ? -status.remaining : status.remaining}
            size="headline"
            tone={over ? "negative" : "default"}
            signDisplay={extra ? "always" : "auto"}
            animated
            {...(over ? { label: `Over by ${spokenAmount(-status.remaining)}` } : {})}
          />
          <span
            className={cn(
              "text-micro font-medium tracking-normal",
              over ? "text-negative" : "text-text-1/80",
            )}
          >
            {subLine(status, allocated)}
          </span>
        </span>
      </span>
    </motion.button>
  );
}

function subLine(status: ReturnType<typeof bucketStatus>, allocated: Paise): React.ReactNode {
  if (status.kind === "spend") {
    const value = status.state === "over" ? -status.remaining : allocated;
    return (
      <>
        {status.state === "over" ? "Over by " : "of "}
        <Amount
          value={value}
          size="caption"
          tone="inherit"
          className="text-micro font-medium tracking-normal"
        />
      </>
    );
  }
  if (status.state === "left") return "left to put away";
  if (status.state === "done") return "All put away";
  return "extra put away";
}

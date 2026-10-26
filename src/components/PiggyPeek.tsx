import { ChevronRight } from "lucide-react";
import { motion } from "motion/react";
import type { Paise } from "@/domain/money";
import { tapScale } from "@/lib/motion";
import { cn } from "@/lib/cn";
import { Amount } from "./Amount";
import { PigIllustration } from "./PigIllustration";

interface PiggyPeekProps {
  name: string;
  emoji: string;
  saved: Paise;
  target: Paise;
  daysLeft: number;
  onClick?: () => void;
  className?: string;
}

/** Home's compact card for the nearest piggy (PRD §8.3), with a small filling pig. */
export function PiggyPeek({
  name,
  emoji,
  saved,
  target,
  daysLeft,
  onClick,
  className,
}: PiggyPeekProps) {
  return (
    <motion.button
      type="button"
      whileTap={tapScale}
      onClick={onClick}
      className={cn(
        "relative flex w-full items-center gap-4 overflow-hidden rounded-card border border-hairline bg-surface-1 py-4 pr-4 pl-2 text-left",
        className,
      )}
    >
      <span
        aria-hidden="true"
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(60% 120% at 15% 50%, color-mix(in srgb, var(--piggy-strong) 16%, transparent), transparent 70%)",
        }}
      />
      <PigIllustration
        progress={target > 0 ? saved / target : 0}
        width={128}
        className="relative"
      />
      <span className="relative flex min-w-0 flex-1 flex-col">
        <span className="truncate text-callout text-text-2">
          <span aria-hidden="true">{emoji} </span>
          {name}
        </span>
        <Amount value={saved} size="title" rounded animated />
        <span className="text-caption text-text-2">
          of <Amount value={target} size="caption" tone="inherit" rounded /> · {daysLeft}{" "}
          {daysLeft === 1 ? "day" : "days"}
        </span>
      </span>
      <ChevronRight aria-hidden="true" className="relative size-5 shrink-0 text-text-3" />
    </motion.button>
  );
}

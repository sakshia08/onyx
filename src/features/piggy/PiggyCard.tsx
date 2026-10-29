import { ChevronRight } from "lucide-react";
import { motion } from "motion/react";
import { Amount } from "@/components/Amount";
import { ProgressRing } from "@/components/ProgressRing";
import { piggyBalance, piggyProgress } from "@/domain/piggy";
import { daysToGo } from "@/domain/piggy-actions";
import type { DayKey, Piggy } from "@/domain/types";
import { tapScale } from "@/lib/motion";
import { countdown } from "./piggy-text";

/** A piggy in the "All piggies" list: ring, emoji, balance of target, countdown (PRD §8.6). */
export function PiggyCard({
  piggy,
  today,
  onClick,
}: {
  piggy: Piggy;
  today: DayKey;
  onClick: () => void;
}) {
  const left = piggy.status === "completed" ? "Done" : countdown(daysToGo(piggy, today));
  return (
    <motion.button
      type="button"
      whileTap={tapScale}
      onClick={onClick}
      className="flex min-h-[72px] w-full items-center gap-3 rounded-card border border-hairline bg-surface-1 px-4 py-3 text-left"
    >
      <ProgressRing value={piggyProgress(piggy)} color="var(--piggy)">
        <span aria-hidden="true" className="text-[20px] leading-none">
          {piggy.emoji}
        </span>
      </ProgressRing>
      <span className="flex min-w-0 flex-1 flex-col">
        <span className="truncate text-body text-text-1">{piggy.name}</span>
        <span className="text-caption text-text-2">
          <Amount value={piggyBalance(piggy)} size="caption" tone="auto" rounded /> of{" "}
          <Amount value={piggy.target} size="caption" tone="inherit" rounded />
        </span>
      </span>
      {left !== "" && <span className="shrink-0 text-caption text-text-3">{left}</span>}
      <ChevronRight aria-hidden="true" className="size-4 shrink-0 text-text-3" />
    </motion.button>
  );
}

import { motion } from "motion/react";
import type { Paise } from "@/domain/money";
import { spokenAmount } from "@/domain/money";
import { tapScale } from "@/lib/motion";
import { Amount } from "./Amount";

interface QuickLogChipProps {
  emoji: string;
  label: string;
  amount: Paise;
  onClick?: () => void;
}

/** A favorite on Home's quick-log row (PRD §8.3): one tap logs it. */
export function QuickLogChip({ emoji, label, amount, onClick }: QuickLogChipProps) {
  return (
    <motion.button
      type="button"
      whileTap={tapScale}
      onClick={onClick}
      aria-label={`Log ${label}, ${spokenAmount(amount)}`}
      className="flex h-11 shrink-0 items-center gap-2 rounded-pill border border-hairline bg-surface-1 pr-4 pl-3 text-callout text-text-1"
    >
      <span aria-hidden="true">{emoji}</span>
      <span aria-hidden="true">{label}</span>
      <Amount value={amount} size="callout" tone="inherit" className="text-text-2" />
    </motion.button>
  );
}

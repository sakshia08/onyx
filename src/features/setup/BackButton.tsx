import { ChevronLeft } from "lucide-react";
import { motion } from "motion/react";
import { tapScale } from "@/lib/motion";

/** "‹ Back" in the top-left, with a 44 px tap area. */
export function BackButton({ label = "Back", onClick }: { label?: string; onClick: () => void }) {
  return (
    <motion.button
      type="button"
      whileTap={tapScale}
      onClick={onClick}
      className="-ml-2 inline-flex h-11 items-center gap-0.5 self-start pr-3 text-callout text-text-2"
    >
      <ChevronLeft aria-hidden="true" className="size-6" strokeWidth={2} />
      {label}
    </motion.button>
  );
}

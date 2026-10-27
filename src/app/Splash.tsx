import { motion } from "motion/react";
import { PigIcon } from "@/components/PigIcon";

/** Shown until saved data has loaded (PRD §11). Fades in late, so a quick load never flashes. */
export function Splash() {
  return (
    <motion.div
      role="status"
      aria-label="Loading Onyx"
      className="fixed inset-0 grid place-items-center bg-bg"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.25, duration: 0.2 }}
    >
      <div className="flex flex-col items-center gap-3">
        <PigIcon aria-hidden="true" className="size-10 text-piggy-strong" strokeWidth={1.8} />
        <p className="text-headline text-text-1">Onyx</p>
      </div>
    </motion.div>
  );
}

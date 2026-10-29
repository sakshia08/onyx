import { useReducedMotion } from "motion/react";
import { useAppStore } from "@/store";

/** Less movement: the iPhone's Reduce Motion, or Onyx's own setting (PRD §8.12, §10.7). */
export function useReduceMotion(): boolean {
  const system = useReducedMotion() ?? false;
  const setting = useAppStore((s) => s.data.settings.motion);
  return system || setting === "reduced";
}

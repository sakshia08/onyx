import { motion, type HTMLMotionProps, type MotionStyle } from "motion/react";
import type { BucketColor } from "@/domain/bucket-colors";
import { tapScale } from "@/lib/motion";
import { cn } from "@/lib/cn";
import { toneStyle } from "./bucket-color";

type ChipProps = Omit<HTMLMotionProps<"button">, "children" | "color" | "style"> & {
  selected?: boolean;
  /** Bucket color: a selected chip turns tinted in this color. */
  color?: BucketColor;
  leading?: React.ReactNode;
  children: React.ReactNode;
};

/** A selectable pill (PRD §10.5). 36 px tall, with a 44 px tap area. */
export function Chip({
  selected = false,
  color,
  leading,
  className,
  children,
  ...props
}: ChipProps) {
  return (
    <motion.button
      type="button"
      aria-pressed={selected}
      whileTap={tapScale}
      style={(color ? toneStyle(color) : {}) as MotionStyle}
      className={cn(
        "hit-44 inline-flex h-9 shrink-0 items-center gap-1.5 rounded-pill border px-3.5 text-callout font-medium whitespace-nowrap transition-colors",
        !selected && "border-hairline bg-surface-2 text-text-2",
        selected &&
          color &&
          "border-[color-mix(in_srgb,var(--tone)_40%,transparent)] bg-(--tone-tint) text-(--tone)",
        selected && !color && "border-transparent bg-text-1 text-bg",
        className,
      )}
      {...props}
    >
      {leading !== undefined && <span className="text-body leading-none">{leading}</span>}
      {children}
    </motion.button>
  );
}

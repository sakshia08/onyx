import { motion } from "motion/react";
import { fillSpring } from "@/lib/motion";
import { cn } from "@/lib/cn";

interface ProgressBarProps {
  /** 0–1. Values above 1 show a full bar. */
  value: number;
  /** Where spending "should" be today, 0–1 (PRD §7.2 pace tick). */
  paceTick?: number;
  /** Any CSS color, usually a bucket color variable. */
  color: string;
  over?: boolean;
  size?: "thin" | "regular";
  /** Light track, for use on the aurora hero card. */
  onAurora?: boolean;
  label: string;
  className?: string;
}

export function ProgressBar({
  value,
  paceTick,
  color,
  over = false,
  size = "regular",
  onAurora = false,
  label,
  className,
}: ProgressBarProps) {
  const clamped = Math.min(1, Math.max(0, value));
  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(clamped * 100)}
      className={cn("relative", size === "thin" ? "h-1" : "h-1.5", className)}
    >
      <div
        className={cn(
          "absolute inset-0 overflow-hidden rounded-pill",
          onAurora ? "bg-text-1/20" : "bg-text-1/8",
        )}
      >
        <motion.div
          className="h-full origin-left rounded-pill"
          style={{ backgroundColor: over ? "var(--negative)" : color, width: "100%" }}
          initial={{ scaleX: 0 }}
          animate={{ scaleX: clamped }}
          transition={fillSpring}
        />
      </div>
      {paceTick !== undefined && (
        <span
          aria-hidden="true"
          className="absolute -top-[3px] -bottom-[3px] w-0.5 -translate-x-1/2 rounded-pill bg-text-2"
          style={{ left: `${Math.min(1, Math.max(0, paceTick)) * 100}%` }}
        />
      )}
    </div>
  );
}

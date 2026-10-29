import { motion } from "motion/react";
import { fillSpring } from "@/lib/motion";

interface ProgressRingProps {
  /** 0–1. */
  value: number;
  color: string;
  size?: number;
  stroke?: number;
  children?: React.ReactNode;
}

/** A thin circular progress ring (PRD §10.5), e.g. around a piggy's emoji. */
export function ProgressRing({
  value,
  color,
  size = 48,
  stroke = 3.5,
  children,
}: ProgressRingProps) {
  const r = (size - stroke) / 2;
  const level = Math.min(1, Math.max(0, value));
  return (
    <span
      className="relative grid shrink-0 place-items-center"
      style={{ width: size, height: size }}
    >
      <svg
        aria-hidden="true"
        viewBox={`0 0 ${size} ${size}`}
        className="absolute inset-0 -rotate-90"
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="var(--hairline-strong)"
          strokeWidth={stroke}
        />
        {level > 0 && (
          <motion.circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke={color}
            strokeWidth={stroke}
            strokeLinecap="round"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: level }}
            transition={fillSpring}
          />
        )}
      </svg>
      {children}
    </span>
  );
}

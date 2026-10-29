import { useReduceMotion } from "@/lib/reduce-motion";
import { motion } from "motion/react";
import { useId } from "react";
import { fillSpring } from "@/lib/motion";
import { cn } from "@/lib/cn";

/** Quadratic-curve wave strip: crest line at y = 0, filled down to `depth`. */
function wavePath(amplitude: number, wavelength: number, width: number, depth: number): string {
  const half = wavelength / 2;
  let d = `M 0 0 Q ${wavelength / 4} ${-amplitude} ${half} 0`;
  for (let x = half; x < width; x += half) d += ` T ${x + half} 0`;
  return `${d} V ${depth} H 0 Z`;
}

interface LiquidFillProps {
  /** How full, 0–1. Springs to new values; empty hides the surface completely. */
  level: number;
  /** Any CSS color, usually a token variable. */
  color: string;
  /** Color strength at the surface, in percent. It fades to about half at the bottom. */
  strength?: number;
  /** Drawing box. The SVG stretches to its container, so match its rough shape. */
  width: number;
  height: number;
  amplitude?: number;
  wavelength?: number;
  className?: string;
}

/**
 * Liquid filling its container from the bottom, with two drifting waves (PRD §10.1).
 * The same language as the pig's fill: the month tank drains, save vials fill up.
 * Place it inside a `relative overflow-hidden` box; content goes on top with `relative`.
 */
export function LiquidFill({
  level,
  color,
  strength = 60,
  width,
  height,
  amplitude = 4,
  wavelength = 80,
  className,
}: LiquidFillProps) {
  const reduceMotion = useReduceMotion();
  const id = useId().replace(/:/g, "");
  const clamped = Math.min(1, Math.max(0, level));
  const surface = clamped === 0 ? height + amplitude * 2 : height - clamped * height;
  const stripWidth = width + wavelength * 2;
  const depth = height + amplitude * 4;
  const mix = (percent: number) =>
    `color-mix(in srgb, ${color} ${Math.round(percent)}%, transparent)`;

  return (
    <svg
      aria-hidden="true"
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="none"
      className={cn("pointer-events-none absolute inset-0 size-full", className)}
    >
      <defs>
        <linearGradient id={`${id}-liquid`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={mix(strength)} />
          <stop offset="1" stopColor={mix(strength * 0.45)} />
        </linearGradient>
      </defs>
      <motion.g initial={{ y: height }} animate={{ y: surface }} transition={fillSpring}>
        {/* Back wave: lighter, slower, drifting the other way */}
        <motion.path
          d={wavePath(amplitude * 0.8, wavelength * 0.8, stripWidth, depth)}
          fill={mix(strength * 0.5)}
          initial={{ x: 0 }}
          animate={reduceMotion ? { x: 0 } : { x: [0, -wavelength * 0.8] }}
          transition={{ duration: 7, ease: "linear", repeat: Infinity }}
        />
        <motion.path
          d={wavePath(amplitude, wavelength, stripWidth, depth)}
          fill={`url(#${id}-liquid)`}
          initial={{ x: -wavelength }}
          animate={reduceMotion ? { x: -wavelength } : { x: [-wavelength, 0] }}
          transition={{ duration: 5, ease: "linear", repeat: Infinity }}
        />
      </motion.g>
    </svg>
  );
}

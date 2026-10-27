import { cn } from "@/lib/cn";
import { LiquidFill } from "./LiquidFill";

interface TankProps {
  /** Accessible name for the whole tank, e.g. "This month". */
  label: string;
  /** How full, 0–1. */
  level: number;
  /** Any CSS color, usually a token variable. */
  color: string;
  /** Liquid strength in percent. Bucket colors are lighter, so they need more. */
  strength?: number;
  /** Where the level "should" be today, 0–1. Shows the pace notch. */
  pace?: number;
  over?: boolean;
  /** Top row: the micro label and an optional pill. */
  header: React.ReactNode;
  /** The big amount. */
  children: React.ReactNode;
  /** Bottom line, over the liquid. */
  footer?: React.ReactNode;
  className?: string;
}

/**
 * A tall card of liquid (PRD §10.1): the month on Home, or one bucket on its detail screen.
 * Over budget, it's empty and the edge turns red.
 */
export function Tank({
  label,
  level,
  color,
  strength = 62,
  pace,
  over = false,
  header,
  children,
  footer,
  className,
}: TankProps) {
  return (
    <section
      aria-label={label}
      className={cn(
        "grain relative h-[272px] overflow-hidden rounded-tank border bg-surface-1",
        over ? "border-negative/45" : "border-hairline",
        className,
      )}
    >
      <LiquidFill
        level={level}
        color={color}
        strength={strength}
        width={350}
        height={272}
        amplitude={5}
        wavelength={110}
      />
      {pace !== undefined && !over && (
        <span
          aria-hidden="true"
          className="absolute right-0 h-0.5 w-4 rounded-l-pill bg-text-1/45"
          style={{ bottom: `${pace * 100}%` }}
        />
      )}
      <div className="relative flex h-full flex-col p-6">
        <div className="flex min-h-8 items-center justify-between gap-3">{header}</div>
        {children}
        {footer !== undefined && <div className="mt-auto">{footer}</div>}
      </div>
    </section>
  );
}

/** The small "13 days left" pill in a tank's top row. */
export function TankPill({ children }: { children: React.ReactNode }) {
  return (
    <span className="shrink-0 rounded-pill bg-text-1/10 px-3 py-1.5 text-caption text-text-1">
      {children}
    </span>
  );
}

import { motion } from "motion/react";
import { useId } from "react";
import { spokenAmount, type Paise } from "@/domain/money";
import { fillSpring } from "@/lib/motion";
import { useWidth } from "@/lib/use-width";
import { Amount } from "./Amount";

export interface ChartBar {
  label: string;
  /** For VoiceOver and the value tag, e.g. "Mon 16 Nov". */
  name: string;
  value: Paise;
  /** Days outside the month: drawn as an empty slot, not selectable. */
  disabled?: boolean;
}

interface BarChartProps {
  bars: ChartBar[];
  selected: number;
  onSelect: (index: number) => void;
  /** Show every label, or only some (Month view has 30 bars). */
  labelEvery?: number;
  height?: number;
}

const LABEL_SPACE = 22;
const TAG_SPACE = 34;

/**
 * Spending bars in custom SVG (PRD §8.9: no chart library). The selected bar is lit with the
 * accent gradient and carries a small value tag; the others are muted.
 */
export function BarChart({
  bars,
  selected,
  onSelect,
  labelEvery = 1,
  height = 180,
}: BarChartProps) {
  const { ref, width } = useWidth<HTMLDivElement>();
  const id = useId().replace(/:/g, "");
  const max = Math.max(1, ...bars.map((b) => b.value));
  const slot = bars.length > 0 ? width / bars.length : 0;
  const barWidth = Math.max(3, Math.min(28, slot * 0.6));
  const plot = height - LABEL_SPACE - TAG_SPACE;
  const current = bars[selected];

  return (
    <div ref={ref} className="relative w-full" style={{ height }}>
      {width > 0 && (
        <svg
          width={width}
          height={height}
          role="group"
          aria-label="Spending by day"
          className="block"
        >
          <defs>
            <linearGradient id={`${id}-lit`} x1="0" y1="1" x2="0" y2="0">
              <stop offset="0" stopColor="var(--liquid)" />
              <stop offset="1" stopColor="var(--accent)" />
            </linearGradient>
          </defs>
          {bars.map((bar, i) => {
            const h = bar.value > 0 ? Math.max(4, (bar.value / max) * plot) : 2;
            const x = i * slot + (slot - barWidth) / 2;
            const isSelected = i === selected;
            return (
              <g
                key={i}
                role={bar.disabled ? undefined : "button"}
                tabIndex={bar.disabled ? undefined : 0}
                aria-pressed={bar.disabled ? undefined : isSelected}
                aria-label={bar.disabled ? undefined : `${bar.name}: ${spokenAmount(bar.value)}`}
                onClick={() => {
                  if (!bar.disabled) onSelect(i);
                }}
                onKeyDown={(e) => {
                  if (!bar.disabled && (e.key === "Enter" || e.key === " ")) onSelect(i);
                }}
                className={bar.disabled ? undefined : "cursor-pointer outline-none"}
              >
                {/* Tall invisible hit area, so thin bars are easy to tap */}
                <rect
                  x={i * slot}
                  y={0}
                  width={slot}
                  height={height - LABEL_SPACE}
                  fill="transparent"
                />
                <motion.rect
                  x={x}
                  width={barWidth}
                  rx={Math.min(6, barWidth / 2)}
                  initial={{ y: TAG_SPACE + plot, height: 0 }}
                  animate={{ y: TAG_SPACE + plot - h, height: h }}
                  transition={fillSpring}
                  fill={
                    bar.disabled
                      ? "var(--surface-2)"
                      : isSelected
                        ? `url(#${id}-lit)`
                        : "var(--surface-3)"
                  }
                />
                {/* Every Nth label, plus the selected one; neighbours of the selected bar step aside */}
                {(isSelected ||
                  ((i % labelEvery === 0 || i === bars.length - 1) &&
                    (labelEvery === 1 || Math.abs(i - selected) > 1))) && (
                  <text
                    x={i * slot + slot / 2}
                    y={height - 6}
                    textAnchor="middle"
                    fontSize="11"
                    fill={isSelected ? "var(--text-1)" : "var(--text-3)"}
                    fontWeight={isSelected ? 600 : 500}
                    className="tabular-nums"
                  >
                    {bar.label}
                  </text>
                )}
              </g>
            );
          })}
        </svg>
      )}
      {current && !current.disabled && width > 0 && (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute top-0 -translate-x-1/2 rounded-pill bg-surface-3 px-2 py-0.5 text-caption whitespace-nowrap text-text-1"
          style={{ left: Math.min(width - 40, Math.max(40, selected * slot + slot / 2)) }}
        >
          {/* More money back than spent that day: shown as money in, never as red */}
          {current.value < 0 ? (
            <Amount value={-current.value} size="caption" signDisplay="always" tone="positive" />
          ) : (
            <Amount value={current.value} size="caption" />
          )}
        </div>
      )}
    </div>
  );
}

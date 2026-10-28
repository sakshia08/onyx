import { getDay } from "date-fns";
import { fromISODate, isoForDay, monthName } from "@/domain/dates";
import type { MonthKey } from "@/domain/types";
import { cn } from "@/lib/cn";

const WEEKDAYS = ["M", "T", "W", "T", "F", "S", "S"];

/** A month grid for back-dating an entry: the 1st through today only (PRD §8.4). */
export function DayPicker({
  monthKey,
  selected,
  lastDay,
  daysInMonth,
  onPick,
}: {
  monthKey: MonthKey;
  selected: number;
  /** Today: later days can't be picked. */
  lastDay: number;
  daysInMonth: number;
  onPick: (day: number) => void;
}) {
  // Monday-first grid: blank cells before the 1st
  const firstWeekday = (getDay(fromISODate(isoForDay(monthKey, 1))) + 6) % 7;
  const cells = [
    ...Array.from({ length: firstWeekday }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  return (
    <div className="flex flex-col gap-2">
      <p className="text-center text-callout text-text-2">{monthName(monthKey)}</p>
      <div className="grid grid-cols-7 text-center text-caption text-text-3" aria-hidden="true">
        {WEEKDAYS.map((d, i) => (
          <span key={i}>{d}</span>
        ))}
      </div>
      <div role="radiogroup" aria-label="Day" className="grid grid-cols-7 gap-1">
        {cells.map((day, i) =>
          day === null ? (
            <span key={`blank-${String(i)}`} />
          ) : (
            <button
              key={day}
              type="button"
              role="radio"
              aria-checked={day === selected}
              aria-label={`${String(day)} ${monthName(monthKey)}${day === lastDay ? ", today" : ""}`}
              disabled={day > lastDay}
              onClick={() => {
                onPick(day);
              }}
              className={cn(
                "grid h-11 place-items-center rounded-pill text-body tabular-nums transition-colors disabled:text-text-3/40",
                day === selected ? "bg-text-1 text-bg" : "text-text-1 active:bg-surface-3",
                day === lastDay && day !== selected && "ring-1 ring-hairline-strong",
              )}
            >
              {day}
            </button>
          ),
        )}
      </div>
    </div>
  );
}

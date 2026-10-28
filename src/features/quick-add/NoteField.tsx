import { CalendarDays } from "lucide-react";
import { Chip } from "@/components/Chip";

interface NoteFieldProps {
  value: string;
  onChange: (note: string) => void;
  suggestions: string[];
  onPickSuggestion: (note: string) => void;
  dayLabel: string;
  onOpenDays: () => void;
}

/** The optional note, its suggestions, and the date chip (PRD §8.4). */
export function NoteField({
  value,
  onChange,
  suggestions,
  onPickSuggestion,
  dayLabel,
  onOpenDays,
}: NoteFieldProps) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <label className="flex h-11 min-w-0 flex-1 items-center rounded-pill border border-hairline bg-surface-2 px-4">
          <span className="sr-only">Note</span>
          <input
            value={value}
            maxLength={60}
            placeholder="Add a note"
            autoComplete="off"
            enterKeyHint="done"
            onChange={(e) => {
              onChange(e.target.value);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") e.currentTarget.blur();
            }}
            className="w-full bg-transparent text-body text-text-1 outline-none placeholder:text-text-3"
          />
        </label>
        <Chip
          leading={<CalendarDays aria-hidden="true" className="size-4" />}
          className="h-11"
          aria-label={`Date: ${dayLabel}. Change`}
          onClick={onOpenDays}
        >
          {dayLabel}
        </Chip>
      </div>
      {suggestions.length > 0 && (
        <div
          className="flex gap-2 overflow-x-auto [scrollbar-width:none]"
          aria-label="Suggested notes"
        >
          {suggestions.map((s) => (
            <Chip
              key={s}
              className="h-8"
              // Keep the keyboard open while picking (no blur before the tap lands)
              onPointerDown={(e) => {
                e.preventDefault();
              }}
              onClick={() => {
                onPickSuggestion(s);
              }}
            >
              {s}
            </Chip>
          ))}
        </div>
      )}
    </div>
  );
}

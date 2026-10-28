import { QuickLogChip } from "@/components/QuickLogChip";
import { toISODate } from "@/domain/dates";
import { entryFromFavorite, usableFavorites } from "@/domain/favorites";
import type { Month } from "@/domain/types";
import { newId } from "@/lib/id";
import { logEntry } from "@/store/actions";
import { useAppStore } from "@/store";
import { useEntryFeedback } from "../quick-add/use-entry-feedback";

/** Home's favorites: one tap logs it, with Undo (PRD §8.3). Hidden until there are favorites. */
export function QuickLogRow({ month }: { month: Month }) {
  const favorites = useAppStore((s) => s.data.favorites);
  const feedback = useEntryFeedback();
  const usable = usableFavorites(favorites, month);
  if (usable.length === 0) return null;

  return (
    <div
      aria-label="Quick log"
      className="relative -mx-screen mt-4 flex gap-2 overflow-x-auto px-screen pb-1 [scrollbar-width:none]"
    >
      {usable.map((f) => (
        <QuickLogChip
          key={f.id}
          emoji={f.emoji ?? "⭐"}
          label={f.label}
          amount={f.amount}
          onClick={() => {
            const entry = entryFromFavorite(f, newId(), toISODate(new Date()));
            feedback.logged(entry, logEntry(entry));
          }}
        />
      ))}
    </div>
  );
}

import { Plus } from "lucide-react";

/** Recent, before anything has been logged: points at the + (PRD §8.3 empty states). */
export function RecentEmpty() {
  return (
    <div className="flex items-center gap-4 rounded-card border border-dashed border-hairline-strong px-5 py-5">
      <span
        aria-hidden="true"
        className="grid size-11 shrink-0 place-items-center rounded-pill bg-text-1 text-bg"
      >
        <Plus className="size-5" strokeWidth={2.5} />
      </span>
      <div>
        <p className="text-body text-text-1">Nothing logged yet</p>
        <p className="text-callout text-text-2">Tap + to add your first expense.</p>
      </div>
    </div>
  );
}

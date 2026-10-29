import { ChevronRight, Repeat } from "lucide-react";
import { Link } from "react-router";
import { Screen } from "@/app/Screen";
import { useAppStore } from "@/store";

/** Settings (PRD §8.12). For now only Recurring; the rest arrives in Phase 8. */
export function SettingsScreen() {
  const count = useAppStore((s) => s.data.recurring.length);
  return (
    <Screen>
      <h1 className="text-title text-text-1">Settings</h1>
      <div className="mt-section overflow-hidden rounded-card border border-hairline bg-surface-1">
        <Link to="/recurring" className="flex min-h-14 items-center gap-3 px-4 py-3">
          <span className="grid size-9 place-items-center rounded-inner bg-surface-2 text-text-1">
            <Repeat aria-hidden="true" className="size-5" />
          </span>
          <span className="flex-1 text-body text-text-1">Recurring expenses</span>
          <span className="text-callout text-text-3">{count > 0 ? count : ""}</span>
          <ChevronRight aria-hidden="true" className="size-4 text-text-3" />
        </Link>
      </div>
      <p className="mt-4 px-1 text-caption text-text-3">
        Privacy, backup and the other settings arrive in a later update.
      </p>
    </Screen>
  );
}

import { useState } from "react";
import { useNavigate } from "react-router";
import { Screen } from "@/app/Screen";
import { Chip } from "@/components/Chip";
import { groupEntriesByDay } from "@/domain/activity";
import { dayKeyOfDate, monthName } from "@/domain/dates";
import { bucketsForHome } from "@/domain/setup";
import type { ID } from "@/domain/types";
import { useActiveMonth, useNow } from "@/store/hooks";
import { DayGroups } from "../entries/EntryList";
import { BackButton } from "../setup/BackButton";

/**
 * Activity (PRD §8.5): every entry this month, by day, with a filter chip per bucket.
 * Piggy stashes and spends join this list in Phase 5.
 */
export function ActivityScreen() {
  const month = useActiveMonth();
  const now = useNow();
  const navigate = useNavigate();
  const [filter, setFilter] = useState<ID | null>(null);
  if (month === null) return null;

  const { spend, save } = bucketsForHome(month.buckets);
  const entries =
    filter === null ? month.entries : month.entries.filter((e) => e.bucketId === filter);
  const groups = groupEntriesByDay(entries, dayKeyOfDate(now));

  return (
    <Screen>
      <BackButton
        label="Home"
        onClick={() => {
          void navigate("/");
        }}
      />
      <h1 className="mt-2 text-title text-text-1">Activity</h1>
      <p className="text-callout text-text-2">{monthName(month.key)}</p>

      <div
        role="group"
        aria-label="Filter by bucket"
        className="relative -mx-screen mt-4 flex gap-2 overflow-x-auto px-screen py-1 [scrollbar-width:none]"
      >
        <Chip
          selected={filter === null}
          onClick={() => {
            setFilter(null);
          }}
        >
          All
        </Chip>
        {[...spend, ...save].map((b) => (
          <Chip
            key={b.id}
            color={b.color}
            leading={b.emoji}
            selected={filter === b.id}
            onClick={() => {
              setFilter(filter === b.id ? null : b.id);
            }}
          >
            {b.name}
          </Chip>
        ))}
      </div>

      <div className="mt-section">
        {groups.length === 0 ? (
          <p className="rounded-card border border-dashed border-hairline-strong px-5 py-5 text-callout text-text-2">
            {filter === null
              ? "Nothing logged this month yet. Tap + to add an expense."
              : "Nothing in this bucket yet."}
          </p>
        ) : (
          <DayGroups groups={groups} buckets={month.buckets} />
        )}
      </div>
    </Screen>
  );
}

import { useState } from "react";
import { useNavigate } from "react-router";
import { Screen } from "@/app/Screen";
import { Amount } from "@/components/Amount";
import { Chip } from "@/components/Chip";
import { PigIcon } from "@/components/PigIcon";
import { groupActivityByDay, monthActivity, type ActivityItem } from "@/domain/activity";
import { dayKeyOfDate, monthName } from "@/domain/dates";
import { spokenAmount } from "@/domain/money";
import { bucketsForHome } from "@/domain/setup";
import type { ID } from "@/domain/types";
import { useActiveMonth, useNow } from "@/store/hooks";
import { useAppStore } from "@/store";
import { BucketEntryRow } from "../entries/EntryList";
import { PiggyTxnRow } from "../piggy/PiggyTxnRow";
import { BackButton } from "../setup/BackButton";

type Filter = { kind: "all" } | { kind: "bucket"; id: ID } | { kind: "piggies" };

/**
 * Activity (PRD §8.5): every entry this month, plus piggy stashes and spends (with a pig
 * badge), by day, with filter chips. Piggy spends don't count in a day's total.
 */
export function ActivityScreen() {
  const month = useActiveMonth();
  const piggies = useAppStore((s) => s.data.piggies);
  const now = useNow();
  const navigate = useNavigate();
  const [filter, setFilter] = useState<Filter>({ kind: "all" });
  if (month === null) return null;

  const { spend, save } = bucketsForHome(month.buckets);
  const all = monthActivity(month.entries, piggies, month.key);
  const shown = all.filter((item: ActivityItem) =>
    filter.kind === "all"
      ? true
      : filter.kind === "piggies"
        ? item.kind === "piggy"
        : item.kind === "entry" && item.entry.bucketId === filter.id,
  );
  const days = groupActivityByDay(shown, dayKeyOfDate(now));
  const hasPiggyItems = all.some((i) => i.kind === "piggy");
  const isBucket = (id: ID) => filter.kind === "bucket" && filter.id === id;

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
          selected={filter.kind === "all"}
          onClick={() => {
            setFilter({ kind: "all" });
          }}
        >
          All
        </Chip>
        {[...spend, ...save].map((b) => (
          <Chip
            key={b.id}
            color={b.color}
            leading={b.emoji}
            selected={isBucket(b.id)}
            onClick={() => {
              setFilter(isBucket(b.id) ? { kind: "all" } : { kind: "bucket", id: b.id });
            }}
          >
            {b.name}
          </Chip>
        ))}
        {hasPiggyItems && (
          <Chip
            leading={
              <PigIcon aria-hidden="true" className="size-4 text-piggy-strong" strokeWidth={2.2} />
            }
            selected={filter.kind === "piggies"}
            onClick={() => {
              setFilter(filter.kind === "piggies" ? { kind: "all" } : { kind: "piggies" });
            }}
          >
            Piggies
          </Chip>
        )}
      </div>

      <div className="mt-section flex flex-col gap-5">
        {days.length === 0 ? (
          <p className="rounded-card border border-dashed border-hairline-strong px-5 py-5 text-callout text-text-2">
            {filter.kind === "all"
              ? "Nothing logged this month yet. Tap + to add an expense."
              : "Nothing here yet."}
          </p>
        ) : (
          days.map((d) => (
            <section key={d.day} aria-label={d.label}>
              <div className="flex items-baseline justify-between px-0.5 pb-1">
                <h3 className="micro-label">{d.label}</h3>
                <Amount
                  value={-d.total}
                  size="caption"
                  signDisplay="always"
                  tone="inherit"
                  className="text-text-2"
                  label={
                    d.total >= 0
                      ? `Spent ${spokenAmount(d.total)}`
                      : `Money back ${spokenAmount(-d.total)}`
                  }
                />
              </div>
              <div className="-mx-2">
                {d.items.map((item) =>
                  item.kind === "entry" ? (
                    <BucketEntryRow
                      key={item.entry.id}
                      entry={item.entry}
                      bucket={month.buckets.find((b) => b.id === item.entry.bucketId)}
                    />
                  ) : (
                    <PiggyTxnRow
                      key={item.txn.id}
                      piggy={item.piggy}
                      txn={item.txn}
                      view="month"
                      onOpen={() => {
                        void navigate(`/piggy/${item.piggy.id}`);
                      }}
                    />
                  ),
                )}
              </div>
            </section>
          ))
        )}
      </div>
    </Screen>
  );
}

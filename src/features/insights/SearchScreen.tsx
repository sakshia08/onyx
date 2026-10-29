import { Search, X } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router";
import { Screen } from "@/app/Screen";
import { Amount } from "@/components/Amount";
import { Chip } from "@/components/Chip";
import { SegmentedControl } from "@/components/SegmentedControl";
import { monthName } from "@/domain/dates";
import { allBuckets, monthsNewestFirst, searchEntries } from "@/domain/insights";
import type { EntryType, ID, MonthKey } from "@/domain/types";
import { useAppStore } from "@/store";
import { BucketEntryRow } from "../entries/EntryList";
import { BackButton } from "../setup/BackButton";

const TYPES = [
  { value: "all", label: "All" },
  { value: "expense", label: "Expenses" },
  { value: "refund", label: "Money back" },
] as const;

/** Search (PRD §8.9): names across every month, with bucket, month range and type filters. */
export function SearchScreen() {
  const navigate = useNavigate();
  const months = useAppStore((s) => s.data.months);
  const [query, setQuery] = useState("");
  const [bucketId, setBucketId] = useState<ID | null>(null);
  const [type, setType] = useState<"all" | EntryType>("all");
  const keys = monthsNewestFirst(months).map((m) => m.key);
  const [from, setFrom] = useState<MonthKey>("");
  const [to, setTo] = useState<MonthKey>("");

  const searching =
    query.trim() !== "" || bucketId !== null || type !== "all" || from !== "" || to !== "";
  const results = searchEntries(months, {
    query,
    ...(bucketId !== null ? { bucketId } : {}),
    ...(type !== "all" ? { type } : {}),
    ...(from !== "" ? { from } : {}),
    ...(to !== "" ? { to } : {}),
  });
  const label = (key: MonthKey) => `${monthName(key)} ${key.slice(0, 4)}`;

  return (
    <Screen>
      <BackButton
        label="Insights"
        onClick={() => {
          void navigate(-1);
        }}
      />
      <h1 className="mt-2 text-title text-text-1">Search</h1>

      <label className="mt-4 flex h-12 items-center gap-2 rounded-pill border border-hairline bg-surface-2 px-4">
        <Search aria-hidden="true" className="size-5 shrink-0 text-text-3" />
        <span className="sr-only">Search names</span>
        <input
          type="search"
          value={query}
          autoFocus
          enterKeyHint="search"
          placeholder="Starbucks, rent, momos…"
          onChange={(e) => {
            setQuery(e.target.value);
          }}
          className="w-full bg-transparent text-body text-text-1 outline-none placeholder:text-text-3 [&::-webkit-search-cancel-button]:appearance-none"
        />
        {query !== "" && (
          <button
            type="button"
            aria-label="Clear search"
            onClick={() => {
              setQuery("");
            }}
            className="-mr-2 grid size-9 place-items-center text-text-3"
          >
            <X aria-hidden="true" className="size-4" />
          </button>
        )}
      </label>

      <div
        role="group"
        aria-label="Bucket"
        className="relative -mx-screen mt-3 flex gap-2 overflow-x-auto px-screen py-1 [scrollbar-width:none]"
      >
        <Chip
          selected={bucketId === null}
          onClick={() => {
            setBucketId(null);
          }}
        >
          All buckets
        </Chip>
        {allBuckets(months).map((b) => (
          <Chip
            key={b.id}
            color={b.color}
            leading={b.emoji}
            selected={bucketId === b.id}
            onClick={() => {
              setBucketId(bucketId === b.id ? null : b.id);
            }}
          >
            {b.name}
          </Chip>
        ))}
      </div>

      <SegmentedControl
        label="Type"
        options={TYPES}
        value={type}
        onChange={setType}
        className="mt-3"
      />

      <div className="mt-3 grid grid-cols-2 gap-2">
        {(
          [
            ["From", from, setFrom],
            ["To", to, setTo],
          ] as const
        ).map(([name, value, set]) => (
          <label key={name} className="flex flex-col gap-1">
            <span className="px-1 text-caption text-text-3">{name}</span>
            <select
              value={value}
              onChange={(e) => {
                set(e.target.value);
              }}
              className="h-11 rounded-inner border border-hairline bg-surface-2 px-3 text-body text-text-1"
            >
              <option value="">Any month</option>
              {keys.map((k) => (
                <option key={k} value={k}>
                  {label(k)}
                </option>
              ))}
            </select>
          </label>
        ))}
      </div>

      {!searching ? (
        <p className="mt-section text-center text-callout text-text-2">
          Search names across every month.
        </p>
      ) : results.count === 0 ? (
        <p className="mt-section text-center text-callout text-text-2">Nothing matches.</p>
      ) : (
        <>
          <p className="mt-section text-callout text-text-1" aria-live="polite">
            {results.count} {results.count === 1 ? "entry" : "entries"} ·{" "}
            <Amount value={results.total} size="callout" tone="inherit" />
          </p>
          <div className="mt-3 flex flex-col gap-5">
            {results.months.map(({ month, entries, total }) => (
              <section key={month.key} aria-label={label(month.key)}>
                <div className="flex items-baseline justify-between px-0.5 pb-1">
                  <h2 className="micro-label">{label(month.key)}</h2>
                  <Amount value={total} size="caption" tone="inherit" className="text-text-2" />
                </div>
                <div className="-mx-2">
                  {entries.map((e) => (
                    <BucketEntryRow
                      key={e.id}
                      entry={e}
                      bucket={month.buckets.find((b) => b.id === e.bucketId)}
                      readOnly={month.status === "closed"}
                    />
                  ))}
                </div>
              </section>
            ))}
          </div>
        </>
      )}
    </Screen>
  );
}

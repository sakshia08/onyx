import { Amount } from "@/components/Amount";
import { EntryRow } from "@/components/EntryRow";
import { entryTime, type DayGroup } from "@/domain/activity";
import { spokenAmount } from "@/domain/money";
import type { Bucket, Entry } from "@/domain/types";

/** An entry as a row: the note (or bucket name), "13:42 · Food", and the amount (PRD §8.5). */
export function BucketEntryRow({ entry, bucket }: { entry: Entry; bucket: Bucket | undefined }) {
  const name = bucket?.name ?? "Unknown bucket";
  const note = entry.note?.trim();
  const detail = [entryTime(entry), name, entry.type === "refund" ? "Money back" : null]
    .filter(Boolean)
    .join(" · ");
  return (
    <EntryRow
      emoji={bucket?.emoji ?? "•"}
      color={bucket?.color ?? "slate"}
      title={note !== undefined && note !== "" ? note : name}
      detail={detail}
      amount={entry.amount}
      type={entry.type}
    />
  );
}

/** Entries grouped by day, each day with its total. */
export function DayGroups({ groups, buckets }: { groups: DayGroup[]; buckets: readonly Bucket[] }) {
  return (
    <div className="flex flex-col gap-5">
      {groups.map((g) => (
        <section key={g.day} aria-label={g.label}>
          <div className="flex items-baseline justify-between px-0.5 pb-1">
            <h3 className="micro-label">{g.label}</h3>
            {/* Spent shows as −₹, a day with more money back than spent as +₹ */}
            <Amount
              value={-g.total}
              size="caption"
              signDisplay="always"
              tone="inherit"
              className="text-text-2"
              label={
                g.total >= 0
                  ? `Spent ${spokenAmount(g.total)}`
                  : `Money back ${spokenAmount(-g.total)}`
              }
            />
          </div>
          <div className="-mx-2">
            {g.entries.map((e) => (
              <BucketEntryRow
                key={e.id}
                entry={e}
                bucket={buckets.find((b) => b.id === e.bucketId)}
              />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

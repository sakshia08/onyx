import { format } from "date-fns";
import { Lock } from "lucide-react";
import { Amount } from "@/components/Amount";
import { Sheet } from "@/components/Sheet";
import { fromISODate } from "@/domain/dates";
import type { Bucket, Entry } from "@/domain/types";

/** A past month's entry: details only, because past months are read-only (PRD §8.5). */
export function EntryDetailsSheet({
  entry,
  bucket,
  open,
  onOpenChange,
}: {
  entry: Entry;
  bucket: Bucket | undefined;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const rows: [string, React.ReactNode][] = [
    ["Bucket", `${bucket?.emoji ?? ""} ${bucket?.name ?? "Unknown bucket"}`],
    ["Type", entry.type === "refund" ? "Money back" : "Expense"],
    ["When", format(fromISODate(entry.date), "EEE d MMM yyyy, HH:mm")],
    ...(entry.source === "recurring"
      ? [["Logged", "By a recurring rule"] as [string, string]]
      : []),
  ];
  return (
    <Sheet open={open} onOpenChange={onOpenChange} title={entry.note ?? bucket?.name ?? "Entry"}>
      <div className="flex flex-col gap-4 pb-4">
        <Amount
          value={entry.type === "refund" ? entry.amount : -entry.amount}
          signDisplay="always"
          tone={entry.type === "refund" ? "positive" : "default"}
          size="display"
          className="self-center"
        />
        <dl className="overflow-hidden rounded-card border border-hairline bg-surface-2/50">
          {rows.map(([label, value], i) => (
            <div
              key={label}
              className={`flex min-h-12 items-center justify-between px-4 ${i > 0 ? "border-t border-hairline" : ""}`}
            >
              <dt className="text-callout text-text-2">{label}</dt>
              <dd className="text-body text-text-1">{value}</dd>
            </div>
          ))}
        </dl>
        <p className="flex items-center justify-center gap-1.5 text-caption text-text-3">
          <Lock aria-hidden="true" className="size-3.5" />
          Past months are read-only.
        </p>
      </div>
    </Sheet>
  );
}

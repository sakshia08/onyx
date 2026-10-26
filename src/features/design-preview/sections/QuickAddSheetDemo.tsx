import { CalendarDays } from "lucide-react";
import { useState } from "react";
import { AmountInputDisplay } from "@/components/AmountInputDisplay";
import { Chip } from "@/components/Chip";
import { Keypad } from "@/components/Keypad";
import { PigIcon } from "@/components/PigIcon";
import { SegmentedControl } from "@/components/SegmentedControl";
import { Sheet } from "@/components/Sheet";
import { useToast } from "@/components/toast-context";
import { applyKey, evaluate } from "@/domain/expression";
import { formatAmount } from "@/domain/money";
import { SAMPLE_BUCKETS } from "../sample-data";

const TYPES = [
  { value: "expense", label: "Expense" },
  { value: "refund", label: "Money back" },
] as const;

/** A look-only mock of Quick add (the real one is Phase 3). */
export function QuickAddSheetDemo({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [input, setInput] = useState("");
  const [type, setType] = useState<(typeof TYPES)[number]["value"]>("expense");
  const [bucket, setBucket] = useState<string | null>(null);
  const toast = useToast();
  const result = evaluate(input);

  return (
    <Sheet open={open} onOpenChange={onOpenChange} title="Quick add" hideTitle>
      <SegmentedControl label="Entry type" options={TYPES} value={type} onChange={setType} />
      <AmountInputDisplay input={input} className="py-5" />

      <div className="-mx-screen flex gap-2 overflow-x-auto px-screen py-1 [scrollbar-width:none]">
        {SAMPLE_BUCKETS.map((b) => (
          <Chip
            key={b.name}
            color={b.color}
            leading={b.emoji}
            selected={bucket === b.name}
            onClick={() => {
              setBucket(b.name);
            }}
          >
            {b.name}
          </Chip>
        ))}
        {type === "expense" && (
          <Chip leading={<PigIcon className="size-4 text-piggy-strong" strokeWidth={2.2} />}>
            Goa trip
          </Chip>
        )}
      </div>

      <div className="mt-3 flex items-center gap-2">
        <label className="flex h-11 min-w-0 flex-1 items-center rounded-pill border border-hairline bg-surface-2 px-4">
          <span className="sr-only">Note</span>
          <input
            placeholder="Add a note"
            className="w-full bg-transparent text-body text-text-1 outline-none placeholder:text-text-3"
          />
        </label>
        <Chip leading={<CalendarDays aria-hidden="true" className="size-4" />} className="h-11">
          Today
        </Chip>
      </div>

      <Keypad
        className="mt-4 pb-2"
        canSubmit={result.ok && bucket !== null}
        onKey={(key) => {
          setInput((current) => applyKey(current, key));
        }}
        onSubmit={() => {
          if (!result.ok || bucket === null) return;
          onOpenChange(false);
          toast.show({
            message: `${formatAmount(result.value)} logged to ${bucket}`,
            action: { label: "Undo", onAction: () => undefined },
          });
          setInput("");
          setBucket(null);
        }}
      />
    </Sheet>
  );
}

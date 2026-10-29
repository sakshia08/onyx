import { Plus } from "lucide-react";
import { Reorder } from "motion/react";
import { useState } from "react";
import { Amount } from "@/components/Amount";
import { Button } from "@/components/Button";
import { BUCKET_COLORS } from "@/domain/bucket-colors";
import { monthName } from "@/domain/dates";
import type { Paise } from "@/domain/money";
import { unallocated } from "@/domain/totals";
import { averageUsed, committedRecurring } from "@/domain/setup";
import type { Bucket, MonthKey, PiggyPlan } from "@/domain/types";
import { useAppStore } from "@/store";
import { newId } from "@/lib/id";
import { BucketEditorSheet } from "../buckets/BucketEditorSheet";
import { BackButton } from "./BackButton";
import { FullScreen } from "./FullScreen";
import { PiggyPlans } from "./PiggyPlans";
import { SetupBucketRow } from "./SetupBucketRow";
import { UnallocatedLine } from "./UnallocatedLine";
import { StepDots } from "./StepDots";

interface BucketsStepProps {
  monthKey: MonthKey;
  budget: Paise;
  buckets: Bucket[];
  onChange: (buckets: Bucket[]) => void;
  piggyPlans: PiggyPlan[];
  onPlansChange: (plans: PiggyPlan[]) => void;
  onBack: () => void;
  onStart: () => void;
}

/** Step 2: split the budget into buckets (PRD §8.2). */
export function BucketsStep({
  monthKey,
  budget,
  buckets,
  onChange,
  piggyPlans,
  onPlansChange,
  onBack,
  onStart,
}: BucketsStepProps) {
  const [editing, setEditing] = useState<{ bucket: Bucket; isNew: boolean } | null>(null);
  const [editorOpen, setEditorOpen] = useState(false);
  const months = useAppStore((s) => s.data.months);
  const rules = useAppStore((s) => s.data.recurring);
  const left = unallocated({ totalBudget: budget, buckets, piggyPlans });

  const open = (bucket: Bucket, isNew: boolean) => {
    setEditing({ bucket, isNew });
    setEditorOpen(true);
  };

  const addBucket = () => {
    const used = new Set(buckets.map((b) => b.color));
    const color = BUCKET_COLORS.find((c) => !used.has(c)) ?? "slate";
    open(
      {
        id: newId(),
        name: "",
        emoji: "💰",
        color,
        kind: "spend",
        allocated: 0,
        order: buckets.length,
      },
      true,
    );
  };

  return (
    <FullScreen
      footer={
        <div className="flex flex-col gap-3">
          <UnallocatedLine amount={left} />
          <Button size="lg" className="w-full" disabled={buckets.length === 0} onClick={onStart}>
            Start {monthName(monthKey)}
          </Button>
        </div>
      }
    >
      <div className="flex items-center justify-between">
        <BackButton onClick={onBack} />
        <StepDots step={2} />
      </div>
      <h1 className="mt-4 text-title text-text-1">
        Split <Amount value={budget} size="title" />
      </h1>
      <p className="mt-2 text-callout text-text-2">
        Give each bucket its share. Drag to reorder. You can change these any time this month.
      </p>

      <Reorder.Group
        axis="y"
        values={buckets}
        onReorder={onChange}
        className="mt-6 flex flex-col gap-2"
      >
        {buckets.map((b) => (
          <SetupBucketRow
            key={b.id}
            bucket={b}
            hints={{
              average: averageUsed(Object.values(months), b.id, monthKey),
              recurring: committedRecurring(rules, b.id),
            }}
            onUseAverage={(amount) => {
              onChange(buckets.map((x) => (x.id === b.id ? { ...x, allocated: amount } : x)));
            }}
            onOpen={() => {
              open(b, false);
            }}
          />
        ))}
      </Reorder.Group>
      {buckets.length === 0 && (
        <p className="mt-2 text-callout text-text-2">Add at least one bucket to start.</p>
      )}

      <Button variant="secondary" className="mt-3 self-start" onClick={addBucket}>
        <Plus aria-hidden="true" className="size-4" strokeWidth={2.5} />
        Add bucket
      </Button>

      <PiggyPlans plans={piggyPlans} onChange={onPlansChange} />

      {editing && (
        <BucketEditorSheet
          open={editorOpen}
          onOpenChange={setEditorOpen}
          bucket={editing.bucket}
          isNew={editing.isNew}
          others={buckets.filter((b) => b.id !== editing.bucket.id)}
          onSave={(saved) => {
            onChange(
              editing.isNew
                ? [...buckets, saved]
                : buckets.map((b) => (b.id === saved.id ? saved : b)),
            );
            setEditorOpen(false);
          }}
          onDelete={() => {
            onChange(buckets.filter((b) => b.id !== editing.bucket.id));
            setEditorOpen(false);
          }}
        />
      )}
    </FullScreen>
  );
}

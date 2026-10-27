import { Trash2 } from "lucide-react";
import { useState } from "react";
import { AmountInputDisplay } from "@/components/AmountInputDisplay";
import { bucketTint } from "@/components/bucket-color";
import { Button } from "@/components/Button";
import { Keypad } from "@/components/Keypad";
import { SegmentedControl } from "@/components/SegmentedControl";
import { Sheet } from "@/components/Sheet";
import { TextField } from "@/components/TextField";
import type { BucketKind } from "@/domain/budget";
import type { BucketColor } from "@/domain/bucket-colors";
import { applyKeyToSaved, paiseToInput } from "@/domain/expression";
import { formatAmount } from "@/domain/money";
import {
  bucketProblem,
  MAX_BUCKET_NAME,
  MAX_BUDGET,
  parseAllocation,
  type BucketProblem,
} from "@/domain/setup";
import type { Bucket, ID } from "@/domain/types";
import { ColorPicker } from "./ColorPicker";
import { DeletePanel } from "./DeletePanel";
import { EmojiPicker } from "./EmojiPicker";

const KINDS = [
  { value: "spend", label: "Spend" },
  { value: "save", label: "Save" },
] as const satisfies readonly { value: BucketKind; label: string }[];

export interface BucketEditorSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  bucket: Bucket;
  isNew: boolean;
  /** The month's other buckets: for the name check and as places to move entries. */
  others: readonly Bucket[];
  onSave: (bucket: Bucket) => void;
  onDelete?: () => void;
  /** Entries in this bucket. If any, they must be moved before deleting (PRD §13). */
  entryCount?: number;
  onMoveAndDelete?: (toId: ID) => void;
}

/** Add or edit a bucket (PRD §8.2, §8.5): name, emoji, color, kind and amount. */
export function BucketEditorSheet(props: BucketEditorSheetProps) {
  return (
    <Sheet
      open={props.open}
      onOpenChange={props.onOpenChange}
      title={props.isNew ? "New bucket" : `Edit ${props.bucket.name}`}
    >
      <EditorBody {...props} />
    </Sheet>
  );
}

type Panel = "amount" | "emoji" | "delete";

const PROBLEM_TEXT: Record<Exclude<BucketProblem, "name-taken">, string> = {
  "name-missing": "Give it a name.",
  amount: `Up to ${formatAmount(MAX_BUDGET)}.`,
};

function EditorBody({
  bucket,
  isNew,
  others,
  onSave,
  onDelete,
  entryCount = 0,
  onMoveAndDelete,
}: BucketEditorSheetProps) {
  const [name, setName] = useState(bucket.name);
  const [emoji, setEmoji] = useState(bucket.emoji);
  const [color, setColor] = useState<BucketColor>(bucket.color);
  const [kind, setKind] = useState<BucketKind>(bucket.kind);
  const [amountInput, setAmountInput] = useState(paiseToInput(bucket.allocated));
  const [fresh, setFresh] = useState(bucket.allocated > 0);
  const [panel, setPanel] = useState<Panel>("amount");
  const [touchedName, setTouchedName] = useState(false);

  const allocated = parseAllocation(amountInput);
  const problem = bucketProblem({ id: bucket.id, name, allocated: allocated ?? -1 }, others);
  const nameError =
    problem === "name-taken"
      ? `You already have a bucket called ${name.trim()}.`
      : problem === "name-missing" && touchedName
        ? PROBLEM_TEXT["name-missing"]
        : null;
  const canDelete = !isNew && (onDelete !== undefined || onMoveAndDelete !== undefined);

  const save = () => {
    if (problem !== null || allocated === null) return;
    onSave({ ...bucket, name: name.trim(), emoji, color, kind, allocated });
  };

  return (
    <div className="flex flex-col gap-4 pb-2">
      <div className="flex items-start gap-3">
        <button
          type="button"
          aria-label={`Emoji: ${emoji}. Change it`}
          aria-expanded={panel === "emoji"}
          onClick={() => {
            setPanel(panel === "emoji" ? "amount" : "emoji");
          }}
          className="grid size-14 shrink-0 place-items-center rounded-inner border border-hairline text-[28px] leading-none"
          style={{ backgroundColor: bucketTint(color) }}
        >
          {emoji}
        </button>
        <TextField
          label="Name"
          hideLabel
          placeholder="Bucket name"
          value={name}
          maxLength={MAX_BUCKET_NAME}
          autoComplete="off"
          enterKeyHint="done"
          error={nameError}
          onChange={(e) => {
            setName(e.target.value);
          }}
          onBlur={() => {
            setTouchedName(true);
          }}
          className="flex-1"
        />
      </div>

      <div>
        <SegmentedControl label="Kind" options={KINDS} value={kind} onChange={setKind} />
        <p className="mt-2 px-1 text-caption text-text-3">
          {kind === "spend"
            ? "For spending. Gets gentle pace heads-ups."
            : "For money you put away. Going over is good, never red."}
        </p>
      </div>

      <ColorPicker value={color} onChange={setColor} />

      {panel === "emoji" && (
        <EmojiPicker
          value={emoji}
          onPick={(e) => {
            setEmoji(e);
            setPanel("amount");
          }}
        />
      )}

      {panel === "delete" && (
        <DeletePanel
          name={bucket.name}
          entryCount={entryCount}
          others={others}
          onCancel={() => {
            setPanel("amount");
          }}
          {...(onDelete !== undefined ? { onDelete } : {})}
          {...(onMoveAndDelete !== undefined ? { onMoveAndDelete } : {})}
        />
      )}

      {panel === "amount" && (
        <>
          <div>
            <p className="text-center text-caption text-text-2">This month</p>
            <AmountInputDisplay input={amountInput} selected={fresh} />
            <p
              className={allocated === null ? "text-center text-caption text-negative" : "sr-only"}
              aria-live="polite"
            >
              {allocated === null ? PROBLEM_TEXT.amount : ""}
            </p>
          </div>
          <Keypad
            onKey={(key) => {
              setAmountInput((input) => applyKeyToSaved(input, key, fresh));
              setFresh(false);
            }}
            onSubmit={save}
            canSubmit={problem === null}
          />
          {canDelete && (
            <Button
              variant="ghost"
              className="self-center text-negative"
              onClick={() => {
                setPanel("delete");
              }}
            >
              <Trash2 aria-hidden="true" className="size-4" />
              Delete bucket
            </Button>
          )}
        </>
      )}
    </div>
  );
}

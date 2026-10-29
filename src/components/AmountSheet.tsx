import { useState } from "react";
import { AmountInputDisplay } from "./AmountInputDisplay";
import { Keypad } from "./Keypad";
import { Sheet } from "./Sheet";
import { applyKeyToSaved, evaluate, paiseToInput } from "@/domain/expression";
import { formatAmount, MAX_ENTRY_PAISE, type Paise } from "@/domain/money";

interface AmountSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  /** Shown highlighted; the first digit typed replaces it. */
  initial: Paise;
  /** Setup plans can be ₹0; stashes and targets can't. */
  allowZero?: boolean;
  /** A line under the amount, e.g. "Goa trip · ₹18,600 saved". */
  hint?: React.ReactNode;
  onSave: (amount: Paise) => void;
}

/** One amount on the keypad, in a sheet: stash, spend, a piggy target or a plan. */
export function AmountSheet(props: AmountSheetProps) {
  return (
    <Sheet open={props.open} onOpenChange={props.onOpenChange} title={props.title}>
      <AmountForm {...props} />
    </Sheet>
  );
}

function AmountForm({ initial, allowZero = false, hint, onSave, onOpenChange }: AmountSheetProps) {
  const [input, setInput] = useState(paiseToInput(initial));
  const [fresh, setFresh] = useState(initial > 0);
  const result = evaluate(input);
  const zero = !result.ok && (result.reason === "zero" || result.reason === "empty");
  const value = result.ok ? result.value : allowZero && zero ? 0 : null;
  const valid = value !== null && value <= MAX_ENTRY_PAISE;

  return (
    <div className="flex flex-col gap-3 pb-2">
      <div className="py-2">
        <AmountInputDisplay input={input} selected={fresh} />
        <div className="mt-2 min-h-5 text-center text-callout text-text-2" aria-live="polite">
          {!result.ok && result.reason === "too-large"
            ? `Up to ${formatAmount(MAX_ENTRY_PAISE)}.`
            : !result.ok && result.reason === "negative"
              ? "The total can't be below ₹0."
              : hint}
        </div>
      </div>
      <Keypad
        onKey={(key) => {
          setInput((i) => applyKeyToSaved(i, key, fresh));
          setFresh(false);
        }}
        canSubmit={valid}
        onSubmit={() => {
          if (value === null || !valid) return;
          onOpenChange(false);
          onSave(value);
        }}
      />
    </div>
  );
}

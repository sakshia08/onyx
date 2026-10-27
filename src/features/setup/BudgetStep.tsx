import { useState } from "react";
import { AmountInputDisplay } from "@/components/AmountInputDisplay";
import { Chip } from "@/components/Chip";
import { Keypad } from "@/components/Keypad";
import { monthName } from "@/domain/dates";
import { applyKeyToSaved, evaluate, paiseToInput } from "@/domain/expression";
import { formatAmount, type Paise } from "@/domain/money";
import { MAX_BUDGET } from "@/domain/setup";
import type { Month, MonthKey } from "@/domain/types";
import { BackButton } from "./BackButton";
import { FullScreen } from "./FullScreen";
import { StepDots } from "./StepDots";

interface BudgetStepProps {
  monthKey: MonthKey;
  initial: Paise;
  /** Days left when setting up mid-month for the first time, else null. */
  daysLeftNote: number | null;
  previous: Month | null;
  onBack: (() => void) | null;
  onNext: (budget: Paise) => void;
  onSameAsLast: (previous: Month) => void;
}

/** Step 1: "How much for November?" (PRD §8.2). */
export function BudgetStep({
  monthKey,
  initial,
  daysLeftNote,
  previous,
  onBack,
  onNext,
  onSameAsLast,
}: BudgetStepProps) {
  const [input, setInput] = useState(paiseToInput(initial));
  const [fresh, setFresh] = useState(initial > 0);
  const result = evaluate(input);
  const valid = result.ok && result.value <= MAX_BUDGET;
  const month = monthName(monthKey);

  return (
    <FullScreen className="pb-[max(var(--safe-bottom),16px)]">
      <div className="flex items-center justify-between">
        {onBack ? <BackButton onClick={onBack} /> : <span />}
        <StepDots step={1} />
      </div>
      <h1 className="mt-4 text-title text-text-1">How much for {month}?</h1>
      <p className="mt-2 text-callout text-text-2">
        {daysLeftNote !== null
          ? `Just for the rest of ${month}: ${String(daysLeftNote)} ${daysLeftNote === 1 ? "day" : "days"} left.`
          : "Your total for the month, across every bucket."}
      </p>
      {previous && (
        <Chip
          className="mt-4 self-start"
          onClick={() => {
            onSameAsLast(previous);
          }}
        >
          Same as {monthName(previous.key)} · {formatAmount(previous.totalBudget)}
        </Chip>
      )}

      <div className="grid flex-1 place-items-center py-6">
        <AmountInputDisplay input={input} selected={fresh} />
      </div>
      {result.ok && !valid && (
        <p className="mb-3 text-center text-caption text-negative">
          Up to {formatAmount(MAX_BUDGET)}.
        </p>
      )}
      <Keypad
        onKey={(key) => {
          setInput((i) => applyKeyToSaved(i, key, fresh));
          setFresh(false);
        }}
        canSubmit={valid}
        onSubmit={() => {
          if (result.ok && valid) onNext(result.value);
        }}
      />
    </FullScreen>
  );
}

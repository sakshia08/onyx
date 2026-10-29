import { shownAmount } from "@/lib/shown-amount";
import { useState } from "react";
import { AmountInputDisplay } from "@/components/AmountInputDisplay";
import { Keypad } from "@/components/Keypad";
import { Sheet } from "@/components/Sheet";
import { useToast } from "@/components/toast-context";
import { monthName } from "@/domain/dates";
import { applyKeyToSaved, evaluate, paiseToInput } from "@/domain/expression";
import { formatAmount } from "@/domain/money";
import { MAX_BUDGET } from "@/domain/setup";
import { unallocated } from "@/domain/totals";
import type { Month } from "@/domain/types";
import { setMonthBudget } from "@/store/actions";
import { UnallocatedLine } from "../setup/UnallocatedLine";

/** Change this month's total budget after it has started (tap the month tank). */
export function BudgetSheet({
  month,
  open,
  onOpenChange,
}: {
  month: Month;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange} title={`${monthName(month.key)} budget`}>
      <BudgetForm
        month={month}
        onDone={() => {
          onOpenChange(false);
        }}
      />
    </Sheet>
  );
}

function BudgetForm({ month, onDone }: { month: Month; onDone: () => void }) {
  const toast = useToast();
  const [input, setInput] = useState(paiseToInput(month.totalBudget));
  const [fresh, setFresh] = useState(true);
  const result = evaluate(input);
  const valid = result.ok && result.value <= MAX_BUDGET;
  const after = valid ? { ...month, totalBudget: result.value } : month;

  return (
    <div className="flex flex-col gap-3 pb-2">
      <div className="py-2">
        <AmountInputDisplay input={input} selected={fresh} />
        <div className="mt-2 min-h-5">
          {result.ok && !valid ? (
            <p className="text-center text-callout text-negative">
              Up to {formatAmount(MAX_BUDGET)}.
            </p>
          ) : (
            <UnallocatedLine amount={unallocated(after)} />
          )}
        </div>
      </div>
      <Keypad
        onKey={(key) => {
          setInput((i) => applyKeyToSaved(i, key, fresh));
          setFresh(false);
        }}
        canSubmit={valid}
        onSubmit={() => {
          if (!result.ok || !valid) return;
          const before = month.totalBudget;
          setMonthBudget(month.key, result.value);
          onDone();
          toast.show({
            tone: "success",
            message: `Budget is now ${shownAmount(result.value)}`,
            action: {
              label: "Undo",
              onAction: () => {
                setMonthBudget(month.key, before);
              },
            },
          });
        }}
      />
    </div>
  );
}

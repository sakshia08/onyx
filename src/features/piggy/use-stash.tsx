import { useReducedMotion } from "motion/react";
import { useState } from "react";
import { AmountSheet } from "@/components/AmountSheet";
import { useToast } from "@/components/toast-context";
import { dayKeyOfDate } from "@/domain/dates";
import { formatAmount } from "@/domain/money";
import { piggyBalance, toStashThisMonth } from "@/domain/piggy";
import type { ID, Piggy } from "@/domain/types";
import { celebrate } from "@/lib/celebrate";
import { deletePiggyTxn, stash } from "@/store/actions";
import { useActiveMonth } from "@/store/hooks";
import { appStore } from "@/store";
import { GoalSheet } from "./GoalSheet";

/** How long the coin takes to land before confetti, if the goal was reached. */
const CELEBRATE_AFTER_MS = 900;

/**
 * Stashing (PRD §8.6): the amount sheet, the coin drop and squish, Undo, and
 * confetti + "You did it!" the first time the target is reached.
 */
export function useStash() {
  const toast = useToast();
  const month = useActiveMonth();
  const reduceMotion = useReducedMotion() ?? false;
  const [target, setTarget] = useState<Piggy | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [goal, setGoal] = useState<Piggy | null>(null);
  const [goalOpen, setGoalOpen] = useState(false);
  const [signals, setSignals] = useState<Record<ID, { stash: number; wiggle: number }>>({});

  const bump = (id: ID, key: "stash" | "wiggle") => {
    setSignals((s) => {
      const current = s[id] ?? { stash: 0, wiggle: 0 };
      return { ...s, [id]: { ...current, [key]: current[key] + 1 } };
    });
  };

  const save = (piggy: Piggy, amount: number) => {
    const change = stash(piggy.id, amount);
    if (change === null) return;
    bump(piggy.id, "stash");
    toast.show({
      tone: "success",
      message: `${formatAmount(amount)} stashed into ${piggy.name}`,
      action: {
        label: "Undo",
        onAction: () => {
          deletePiggyTxn(piggy.id, change.txnId);
        },
      },
    });
    if (change.reachedGoal) {
      window.setTimeout(() => {
        celebrate(reduceMotion);
        bump(piggy.id, "wiggle");
        setGoal(appStore.getState().data.piggies.find((p) => p.id === piggy.id) ?? piggy);
        setGoalOpen(true);
      }, CELEBRATE_AFTER_MS);
    }
  };

  const today = dayKeyOfDate(new Date());
  const element = (
    <>
      {target && (
        <AmountSheet
          key={target.id}
          open={sheetOpen}
          onOpenChange={setSheetOpen}
          title={`Stash into ${target.name}`}
          initial={toStashThisMonth(target, month ?? undefined, today)}
          hint={`${formatAmount(piggyBalance(target))} saved so far. Comes out of this month.`}
          onSave={(amount) => {
            save(target, amount);
          }}
        />
      )}
      {goal && <GoalSheet piggy={goal} open={goalOpen} onOpenChange={setGoalOpen} />}
    </>
  );

  return {
    start: (piggy: Piggy) => {
      setTarget(piggy);
      setSheetOpen(true);
    },
    signalsFor: (id: ID) => signals[id] ?? { stash: 0, wiggle: 0 },
    element,
  };
}

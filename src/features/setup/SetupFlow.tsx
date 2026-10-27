import { useState } from "react";
import { useNavigate } from "react-router";
import {
  dayInMonth,
  daysInMonth,
  daysLeft,
  monthKeyOfDate,
  previousMonthKey,
} from "@/domain/dates";
import type { Paise } from "@/domain/money";
import { defaultBuckets, planFromPrevious } from "@/domain/setup";
import type { Bucket } from "@/domain/types";
import { newId } from "@/lib/id";
import { startMonth } from "@/store/actions";
import { useAppStore } from "@/store";
import { BudgetStep } from "./BudgetStep";
import { BucketsStep } from "./BucketsStep";

/**
 * Monthly setup (PRD §8.2): step 1 the budget, step 2 the buckets, then "Start November".
 * Nothing is saved until Start, so leaving halfway changes nothing.
 */
export function SetupFlow() {
  const navigate = useNavigate();
  const [now] = useState(() => new Date());
  const key = monthKeyOfDate(now);
  const previous = useAppStore((s) => s.data.months[previousMonthKey(key)]);
  const isFirstMonth = useAppStore((s) => Object.keys(s.data.months).length === 0);

  const [step, setStep] = useState<1 | 2>(1);
  const [budget, setBudget] = useState<Paise>(0);
  const [buckets, setBuckets] = useState<Bucket[]>(() =>
    previous ? planFromPrevious(previous).buckets : defaultBuckets(newId),
  );

  const today = dayInMonth(key, now);
  const left = daysLeft(today, daysInMonth(key));

  if (step === 1) {
    return (
      <BudgetStep
        monthKey={key}
        initial={budget}
        // First launch mid-month: the budget is for the rest of the month (PRD §13)
        daysLeftNote={isFirstMonth && today > 1 ? left : null}
        previous={previous ?? null}
        onBack={
          isFirstMonth
            ? () => {
                void navigate("/welcome");
              }
            : null
        }
        onNext={(amount) => {
          setBudget(amount);
          setStep(2);
        }}
        onSameAsLast={(prev) => {
          const plan = planFromPrevious(prev);
          setBudget(plan.totalBudget);
          setBuckets(plan.buckets);
          setStep(2);
        }}
      />
    );
  }

  return (
    <BucketsStep
      monthKey={key}
      budget={budget}
      buckets={buckets}
      onChange={setBuckets}
      onBack={() => {
        setStep(1);
      }}
      onStart={() => {
        const result = startMonth(key, { totalBudget: budget, buckets, piggyPlans: [] }, now);
        if (result.ok) void navigate("/", { replace: true });
      }}
    />
  );
}

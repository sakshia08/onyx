import { useState } from "react";
import { useNavigate } from "react-router";
import { dayInMonth, dayKeyOfDate, daysInMonth, daysLeft, monthKeyOfDate } from "@/domain/dates";
import type { Paise } from "@/domain/money";
import { defaultBuckets, planFromPrevious } from "@/domain/setup";
import { suggestedThisMonth } from "@/domain/piggy";
import type { Bucket, PiggyPlan } from "@/domain/types";
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
  // The most recent earlier month, even if some months in between were never opened
  const previous = useAppStore((s) =>
    Object.values(s.data.months)
      .filter((m) => m.key < key)
      .sort((a, b) => (a.key < b.key ? 1 : -1))
      .at(0),
  );
  const isFirstMonth = useAppStore((s) => Object.keys(s.data.months).length === 0);

  const [step, setStep] = useState<1 | 2>(1);
  const [budget, setBudget] = useState<Paise>(0);
  const [buckets, setBuckets] = useState<Bucket[]>(() =>
    previous ? planFromPrevious(previous).buckets : defaultBuckets(newId),
  );
  // Each active piggy, prefilled with this month's suggestion (PRD §8.2, §7.4)
  const piggies = useAppStore((s) => s.data.piggies);
  const [piggyPlans, setPiggyPlans] = useState<PiggyPlan[]>(() =>
    piggies
      .filter((p) => p.status === "active")
      .map((p) => ({ piggyId: p.id, planned: suggestedThisMonth(p, dayKeyOfDate(now)) ?? 0 })),
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
      piggyPlans={piggyPlans}
      onPlansChange={setPiggyPlans}
      onBack={() => {
        setStep(1);
      }}
      onStart={() => {
        const result = startMonth(key, { totalBudget: budget, buckets, piggyPlans }, now);
        if (result.ok) void navigate("/", { replace: true });
      }}
    />
  );
}

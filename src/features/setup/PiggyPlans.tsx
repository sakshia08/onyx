import { shownAmount } from "@/lib/shown-amount";
import { useState } from "react";
import { Amount } from "@/components/Amount";
import { AmountSheet } from "@/components/AmountSheet";
import { SectionHeader } from "@/components/SectionHeader";
import { dayKeyOfDate } from "@/domain/dates";

import { suggestedThisMonth } from "@/domain/piggy";
import type { ID, PiggyPlan } from "@/domain/types";
import { useAppStore } from "@/store";

/** Setup's piggy section (PRD §8.2): each active piggy with its suggestion prefilled. */
export function PiggyPlans({
  plans,
  onChange,
}: {
  plans: PiggyPlan[];
  onChange: (plans: PiggyPlan[]) => void;
}) {
  const piggies = useAppStore((s) => s.data.piggies);
  const [editing, setEditing] = useState<ID | null>(null);
  const today = dayKeyOfDate(new Date());
  if (plans.length === 0) return null;
  const editingPiggy = piggies.find((p) => p.id === editing);

  return (
    <section aria-label="Piggies">
      <SectionHeader title="Piggies" className="mt-section" />
      <div className="flex flex-col gap-2">
        {plans.map((plan) => {
          const piggy = piggies.find((p) => p.id === plan.piggyId);
          if (!piggy) return null;
          const suggested = suggestedThisMonth(piggy, today);
          return (
            <button
              key={plan.piggyId}
              type="button"
              onClick={() => {
                setEditing(plan.piggyId);
              }}
              aria-label={`${piggy.name}: plan for this month. Edit`}
              className="flex min-h-16 items-center gap-3 rounded-inner border border-hairline bg-surface-1 px-4 py-3 text-left"
            >
              <span
                aria-hidden="true"
                className="grid size-10 shrink-0 place-items-center rounded-pill bg-piggy/14 text-[20px]"
              >
                {piggy.emoji}
              </span>
              <span className="flex min-w-0 flex-1 flex-col">
                <span className="truncate text-body text-text-1">{piggy.name}</span>
                <span className="text-caption text-text-3">
                  {suggested !== null
                    ? `Suggested ${shownAmount(suggested)}`
                    : "No date: any amount"}
                </span>
              </span>
              <Amount value={plan.planned} size="headline" rounded />
            </button>
          );
        })}
      </div>
      {editingPiggy && (
        <AmountSheet
          key={editingPiggy.id}
          open={editing !== null}
          onOpenChange={(open) => {
            if (!open) setEditing(null);
          }}
          title={`${editingPiggy.name} this month`}
          initial={plans.find((p) => p.piggyId === editingPiggy.id)?.planned ?? 0}
          allowZero
          hint="Set to ₹0 to skip this month."
          onSave={(planned) => {
            onChange(plans.map((p) => (p.piggyId === editingPiggy.id ? { ...p, planned } : p)));
          }}
        />
      )}
    </section>
  );
}

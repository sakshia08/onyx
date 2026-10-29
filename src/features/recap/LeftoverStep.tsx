import { shownAmount } from "@/lib/shown-amount";
import { useState } from "react";
import { useNavigate, useParams } from "react-router";
import { Amount } from "@/components/Amount";
import { AmountSheet } from "@/components/AmountSheet";
import { Button } from "@/components/Button";
import { Chip } from "@/components/Chip";
import { PigIllustration } from "@/components/PigIllustration";
import { useToast } from "@/components/toast-context";
import { monthKeyOfDate, monthName } from "@/domain/dates";

import { maxLeftover } from "@/domain/rollover";
import type { ID } from "@/domain/types";
import { finishRecap, moveLeftoverToPiggy } from "@/store/actions";
import { useAppStore } from "@/store";
import { FullScreen } from "../setup/FullScreen";

/**
 * "₹1,800 left in October. Stash some into a piggy?" (PRD §8.6). Can never move more than
 * what's left. The closed month keeps its full remaining amount.
 */
export function LeftoverStep() {
  const toast = useToast();
  const data = useAppStore((s) => s.data);
  const navigate = useNavigate();
  const { key } = useParams();
  // From Insights for any closed month, or right after the recap for the month that just ended
  const fromInsights = key !== undefined;
  const month = data.months[key ?? data.activeMonthKey ?? ""];
  const active = data.piggies.filter((p) => p.status === "active");
  const [piggyId, setPiggyId] = useState<ID | null>(active[0]?.id ?? null);
  const [sheetOpen, setSheetOpen] = useState(false);
  if (!month) return null;

  const left = maxLeftover(month, data.piggies);
  const piggy = active.find((p) => p.id === piggyId);
  const next = monthName(monthKeyOfDate(new Date()));
  const done = () => {
    if (fromInsights) void navigate(-1);
    else finishRecap(month.key);
  };

  return (
    <FullScreen
      footer={
        <Button
          variant={left > 0 ? "secondary" : "primary"}
          size="lg"
          className="w-full"
          onClick={done}
        >
          {fromInsights ? "Done" : left > 0 ? "Skip" : `Plan ${next} →`}
        </Button>
      }
    >
      <div className="flex flex-col items-center pt-8 text-center">
        <PigIllustration progress={0.35} width={180} />
        <h1 className="mt-6 text-title text-text-1">
          <Amount value={left} size="title" /> left in {monthName(month.key)}
        </h1>
        <p className="mt-2 text-body text-text-2">
          {left > 0
            ? "Stash some into a piggy? It stays in your savings."
            : "All moved. Nicely done."}
        </p>
      </div>

      {left > 0 && (
        <div className="mt-8 flex flex-col gap-4">
          <div className="flex flex-wrap justify-center gap-2" role="group" aria-label="Piggy">
            {active.map((p) => (
              <Chip
                key={p.id}
                leading={p.emoji}
                selected={p.id === piggyId}
                onClick={() => {
                  setPiggyId(p.id);
                }}
              >
                {p.name}
              </Chip>
            ))}
          </div>
          <Button
            variant="piggy"
            size="lg"
            className="w-full"
            disabled={!piggy}
            onClick={() => {
              setSheetOpen(true);
            }}
          >
            Stash into {piggy?.name ?? "a piggy"}
          </Button>
        </div>
      )}

      {piggy && (
        <AmountSheet
          key={`${piggy.id}-${String(left)}`}
          open={sheetOpen}
          onOpenChange={setSheetOpen}
          title={`Into ${piggy.name}`}
          initial={left}
          hint={`Up to ${shownAmount(left)}`}
          onSave={(amount) => {
            if (moveLeftoverToPiggy(month.key, piggy.id, amount)) {
              toast.show({
                tone: "success",
                message: `${shownAmount(amount)} moved to ${piggy.name}`,
              });
            } else {
              toast.show({ tone: "warning", message: `You can move up to ${shownAmount(left)}.` });
            }
          }}
        />
      )}
    </FullScreen>
  );
}

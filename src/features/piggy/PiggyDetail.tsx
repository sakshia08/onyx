import { shownAmount } from "@/lib/shown-amount";
import { Pencil } from "lucide-react";
import { useNavigate, useParams } from "react-router";
import { Screen } from "@/app/Screen";
import { Amount } from "@/components/Amount";
import { Button } from "@/components/Button";
import { Chip } from "@/components/Chip";
import { SectionHeader } from "@/components/SectionHeader";
import { dayLabel } from "@/domain/activity";
import { dayKeyOf, dayKeyOfDate } from "@/domain/dates";

import { piggyBalance, toStashThisMonth } from "@/domain/piggy";
import { piggySummary } from "@/domain/piggy-actions";
import type { Piggy } from "@/domain/types";
import { markPiggyDone, movePiggyBalance, reopenPiggy } from "@/store/actions";
import { useActiveMonth, useNow } from "@/store/hooks";
import { useAppStore } from "@/store";
import { useQuickAdd } from "../quick-add/quick-add-context";
import { BackButton } from "../setup/BackButton";
import { PiggyHero } from "./PiggyHero";
import { PiggyTxnRow } from "./PiggyTxnRow";
import { useStash } from "./use-stash";

/** Piggy detail (PRD §8.6): the pig, actions, and the full history. */
export function PiggyDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const piggies = useAppStore((s) => s.data.piggies);
  const piggy = piggies.find((p) => p.id === id);
  const now = useNow();
  const today = dayKeyOfDate(now);
  const stashFlow = useStash();
  const quickAdd = useQuickAdd();
  const month = useActiveMonth();
  const back = () => {
    void navigate("/piggy");
  };

  if (piggy === undefined) {
    return (
      <Screen glow="piggy">
        <BackButton label="Piggy" onClick={back} />
        <p className="mt-6 text-body text-text-2">This piggy doesn't exist any more.</p>
      </Screen>
    );
  }

  const signals = stashFlow.signalsFor(piggy.id);
  const toStash = toStashThisMonth(piggy, month ?? undefined, today);
  const history = [...piggy.transactions].sort((a, b) =>
    a.date !== b.date ? (a.date < b.date ? 1 : -1) : a.createdAt < b.createdAt ? 1 : -1,
  );
  const done = piggy.status === "completed";

  return (
    <Screen glow="piggy">
      <div className="flex items-center justify-between">
        <BackButton label="Piggy" onClick={back} />
        <Button
          variant="ghost"
          className="-mr-3"
          onClick={() => {
            void navigate(`/piggy/${piggy.id}/edit`);
          }}
        >
          <Pencil aria-hidden="true" className="size-4" />
          Edit
        </Button>
      </div>

      <div className="mt-4">
        <PiggyHero
          piggy={piggy}
          today={today}
          stashSignal={signals.stash}
          wiggleSignal={signals.wiggle}
          pigWidth={200}
        />
      </div>

      {done ? (
        <DoneSummary
          piggy={piggy}
          others={piggies.filter((p) => p.id !== piggy.id && p.status === "active")}
        />
      ) : (
        <div className="mt-6 flex flex-col gap-2">
          <Button
            variant="piggy"
            size="lg"
            className="w-full"
            onClick={() => {
              stashFlow.start(piggy);
            }}
          >
            {toStash > 0 ? `Stash ${shownAmount(toStash)}` : "Stash"}
          </Button>
          <div className="flex gap-2">
            <Button
              variant="secondary"
              className="flex-1"
              onClick={() => {
                quickAdd.openSpendFromPiggy(piggy.id);
              }}
            >
              Spend from piggy
            </Button>
            <Button
              variant="secondary"
              className="flex-1"
              onClick={() => {
                markPiggyDone(piggy.id);
              }}
            >
              Mark as done
            </Button>
          </div>
        </div>
      )}

      <SectionHeader title="History" className="mt-section" />
      {history.length === 0 ? (
        <p className="rounded-card border border-dashed border-hairline-strong px-5 py-5 text-callout text-text-2">
          Nothing yet. Stashes and spends will show here.
        </p>
      ) : (
        <div className="-mx-2">
          {history.map((t, i) => {
            const day = dayKeyOf(t.date);
            const newDay = i === 0 || dayKeyOf(history[i - 1]?.date ?? "") !== day;
            return (
              <div key={t.id}>
                {newDay && <h3 className="micro-label px-2.5 pt-3 pb-1">{dayLabel(day, today)}</h3>}
                <PiggyTxnRow piggy={piggy} txn={t} view="piggy" />
              </div>
            );
          })}
        </div>
      )}

      {stashFlow.element}
    </Screen>
  );
}

/** Marked as done: saved vs spent, and moving anything left into another piggy (PRD §8.6). */
function DoneSummary({ piggy, others }: { piggy: Piggy; others: Piggy[] }) {
  const { saved, spent } = piggySummary(piggy);
  const left = piggyBalance(piggy);
  return (
    <div className="mt-6 flex flex-col gap-4 rounded-card border border-hairline bg-surface-1 p-5">
      <div className="grid grid-cols-3 text-center">
        {[
          ["Saved", saved],
          ["Spent", spent],
          ["Left", left],
        ].map(([label, value]) => (
          <div key={label as string}>
            <p className="micro-label">{label}</p>
            <Amount value={value as number} size="headline" rounded />
          </div>
        ))}
      </div>
      {left > 0 && others.length > 0 && (
        <div>
          <p className="text-callout text-text-2">Move {shownAmount(left)} to another piggy:</p>
          <div className="mt-2 flex flex-wrap gap-2" role="group" aria-label="Move what's left to">
            {others.map((o) => (
              <Chip
                key={o.id}
                leading={o.emoji}
                onClick={() => {
                  movePiggyBalance(piggy.id, o.id);
                }}
              >
                {o.name}
              </Chip>
            ))}
          </div>
        </div>
      )}
      <Button
        variant="ghost"
        className="self-center"
        onClick={() => {
          reopenPiggy(piggy.id);
        }}
      >
        Keep saving into it
      </Button>
    </div>
  );
}

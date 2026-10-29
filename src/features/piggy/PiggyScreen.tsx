import { Plus } from "lucide-react";
import { motion } from "motion/react";
import { useRef, useState } from "react";
import { useNavigate } from "react-router";
import { Screen } from "@/app/Screen";
import { Amount } from "@/components/Amount";
import { Button } from "@/components/Button";
import { PigIcon } from "@/components/PigIcon";
import { ProgressBar } from "@/components/ProgressBar";
import { SectionHeader } from "@/components/SectionHeader";
import { dayKeyOfDate } from "@/domain/dates";
import { formatAmount } from "@/domain/money";
import { plannedThisMonth, stashedIntoThisMonth, toStashThisMonth } from "@/domain/piggy";
import type { Piggy } from "@/domain/types";
import { tapScale } from "@/lib/motion";
import { cn } from "@/lib/cn";
import { useActiveMonth, useNow } from "@/store/hooks";
import { useAppStore } from "@/store";
import { useQuickAdd } from "../quick-add/quick-add-context";
import { PiggyCard } from "./PiggyCard";
import { PiggyEmpty } from "./PiggyEmpty";
import { PiggyHero } from "./PiggyHero";
import { useStash } from "./use-stash";

/**
 * The Piggy tab (PRD §8.6): swipe between active piggies, stash with a coin drop,
 * spend from a piggy, and the list of every piggy.
 */
export function PiggyScreen() {
  const navigate = useNavigate();
  const piggies = useAppStore((s) => s.data.piggies);
  const now = useNow();
  const today = dayKeyOfDate(now);
  const stashFlow = useStash();
  const active = piggies.filter((p) => p.status === "active");
  const completed = piggies.filter((p) => p.status === "completed");

  return (
    <Screen glow="piggy">
      <header className="flex items-center justify-between">
        <h1 className="flex items-center gap-2 text-title text-text-1">
          Piggy
          <PigIcon aria-hidden="true" className="size-7 text-piggy-strong" strokeWidth={1.8} />
        </h1>
        <Button
          variant="secondary"
          size="md"
          onClick={() => {
            void navigate("/piggy/new");
          }}
        >
          <Plus aria-hidden="true" className="size-4" strokeWidth={2.5} />
          New
        </Button>
      </header>

      {active.length === 0 ? (
        <PiggyEmpty hasCompleted={completed.length > 0} />
      ) : (
        <Carousel piggies={active} today={today} stashFlow={stashFlow} />
      )}

      {active.length > 0 && (
        <section aria-label="All piggies">
          <SectionHeader title="All piggies" className="mt-section" />
          <div className="flex flex-col gap-2">
            {active.map((p) => (
              <PiggyCard
                key={p.id}
                piggy={p}
                today={today}
                onClick={() => {
                  void navigate(`/piggy/${p.id}`);
                }}
              />
            ))}
            <motion.button
              type="button"
              whileTap={tapScale}
              onClick={() => {
                void navigate("/piggy/new");
              }}
              className="flex min-h-[72px] items-center justify-center gap-2 rounded-card border border-dashed border-hairline-strong text-callout text-text-2"
            >
              <Plus aria-hidden="true" className="size-4" strokeWidth={2.5} />
              New piggy
            </motion.button>
          </div>
        </section>
      )}

      {completed.length > 0 && (
        <details className="group mt-section">
          <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between text-headline text-text-1">
            Completed
            <span className="text-callout text-text-2 group-open:hidden">
              {completed.length} · Show
            </span>
            <span className="hidden text-callout text-text-2 group-open:inline">Hide</span>
          </summary>
          <div className="mt-3 flex flex-col gap-2">
            {completed.map((p) => (
              <PiggyCard
                key={p.id}
                piggy={p}
                today={today}
                onClick={() => {
                  void navigate(`/piggy/${p.id}`);
                }}
              />
            ))}
          </div>
        </details>
      )}

      {stashFlow.element}
    </Screen>
  );
}

/** Active piggies, one per page; swipe sideways between them, with page dots. */
function Carousel({
  piggies,
  today,
  stashFlow,
}: {
  piggies: Piggy[];
  today: string;
  stashFlow: ReturnType<typeof useStash>;
}) {
  const scroller = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);
  const current = piggies[Math.min(index, piggies.length - 1)];
  const quickAdd = useQuickAdd();
  const month = useActiveMonth();
  if (current === undefined) return null;

  const planned = month ? plannedThisMonth(current, month, today) : 0;
  const stashed = month ? stashedIntoThisMonth(current, month.key) : 0;
  const toStash = toStashThisMonth(current, month ?? undefined, today);

  return (
    <section aria-label="Piggies" className="mt-4">
      <div
        ref={scroller}
        onScroll={(e) => {
          const el = e.currentTarget;
          setIndex(Math.round(el.scrollLeft / el.clientWidth));
        }}
        className="-mx-screen flex snap-x snap-mandatory overflow-x-auto [scrollbar-width:none]"
      >
        {piggies.map((p) => {
          const signals = stashFlow.signalsFor(p.id);
          return (
            <div key={p.id} className="w-full shrink-0 snap-center px-screen pt-4">
              <PiggyHero
                piggy={p}
                today={today}
                stashSignal={signals.stash}
                wiggleSignal={signals.wiggle}
              />
            </div>
          );
        })}
      </div>

      {piggies.length > 1 && (
        <div className="mt-4 flex justify-center gap-1" role="tablist" aria-label="Choose a piggy">
          {piggies.map((p, i) => (
            <button
              key={p.id}
              type="button"
              role="tab"
              aria-selected={i === index}
              aria-label={p.name}
              onClick={() => {
                const el = scroller.current;
                el?.scrollTo({ left: i * el.clientWidth, behavior: "smooth" });
              }}
              className="grid size-6 place-items-center"
            >
              <span
                className={cn(
                  "h-1.5 rounded-pill transition-all",
                  i === index ? "w-5 bg-piggy" : "w-1.5 bg-text-3/60",
                )}
              />
            </button>
          ))}
        </div>
      )}

      <div className="mt-6 flex flex-col gap-2">
        <Button
          variant="piggy"
          size="lg"
          className="w-full"
          onClick={() => {
            stashFlow.start(current);
          }}
        >
          {toStash > 0 ? `Stash ${formatAmount(toStash)}` : "Stash"}
        </Button>
        <Button
          variant="secondary"
          size="lg"
          className="w-full"
          onClick={() => {
            quickAdd.openSpendFromPiggy(current.id);
          }}
        >
          Spend from piggy
        </Button>
      </div>

      {planned > 0 && (
        <div className="mt-5">
          <p className="text-callout text-text-2">
            This month: <Amount value={stashed} size="callout" tone="inherit" rounded /> of{" "}
            <Amount value={planned} size="callout" tone="inherit" rounded /> stashed
          </p>
          <ProgressBar
            className="mt-2"
            value={stashed / planned}
            color="var(--piggy)"
            label={`${current.name}: this month's stash`}
          />
        </div>
      )}
    </section>
  );
}

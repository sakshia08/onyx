import { X } from "lucide-react";
import { useReducedMotion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/Button";
import type { MonthRecap } from "@/domain/recap";
import { celebrate } from "@/lib/celebrate";
import { cn } from "@/lib/cn";
import { useAppStore } from "@/store";
import {
  BackupCard,
  BucketsCard,
  CompareCard,
  HighlightsCard,
  PiggiesCard,
  ReviewCard,
} from "./RecapCards";

interface RecapStoriesProps {
  recap: MonthRecap;
  /** The last card's button, e.g. "Plan December →" or "Done". */
  finishLabel: string;
  onFinish: () => void;
  onClose?: () => void;
}

/**
 * The recap as story cards (PRD §8.8): swipe or tap Next, with a progress bar per card.
 * A little confetti on the first card when the month ended under budget.
 */
export function RecapStories({ recap, finishLabel, onFinish, onClose }: RecapStoriesProps) {
  const backupStep = useAppStore((s) => s.data.settings.monthlyBackupStep);
  const reduceMotion = useReducedMotion() ?? false;
  const scroller = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);

  const cards: { id: string; node: React.ReactNode }[] = [
    { id: "review", node: <ReviewCard recap={recap} /> },
    { id: "buckets", node: <BucketsCard recap={recap} /> },
    { id: "highlights", node: <HighlightsCard recap={recap} /> },
    ...(recap.comparison ? [{ id: "compare", node: <CompareCard recap={recap} /> }] : []),
    ...(recap.piggies.length > 0 ? [{ id: "piggies", node: <PiggiesCard recap={recap} /> }] : []),
    ...(backupStep ? [{ id: "backup", node: <BackupCard recap={recap} /> }] : []),
  ];
  const last = cards.length - 1;

  // Under budget: a little confetti on the first card, once
  useEffect(() => {
    if (recap.left > 0) {
      const timer = window.setTimeout(() => {
        celebrate(reduceMotion);
      }, 500);
      return () => {
        window.clearTimeout(timer);
      };
    }
  }, [recap.left, reduceMotion]);

  const go = (i: number) => {
    const el = scroller.current;
    el?.scrollTo({ left: i * el.clientWidth, behavior: reduceMotion ? "auto" : "smooth" });
  };

  return (
    <div className="fixed inset-0 z-40 flex flex-col bg-bg">
      <div aria-hidden="true" className="screen-glow" />
      <div
        className="relative z-10 mx-auto flex w-full max-w-[560px] items-center gap-3 px-screen"
        style={{ paddingTop: "calc(var(--safe-top) + 8px)" }}
      >
        <div
          className="flex flex-1 gap-1"
          role="progressbar"
          aria-label="Recap"
          aria-valuemin={1}
          aria-valuemax={cards.length}
          aria-valuenow={index + 1}
        >
          {cards.map((c, i) => (
            <span key={c.id} className="h-1 flex-1 overflow-hidden rounded-pill bg-text-1/15">
              <span
                className={cn(
                  "block h-full rounded-pill bg-text-1 transition-all",
                  i <= index ? "w-full" : "w-0",
                )}
              />
            </span>
          ))}
        </div>
        {onClose && (
          <button
            type="button"
            aria-label="Close recap"
            onClick={onClose}
            className="grid size-11 place-items-center text-text-2"
          >
            <X aria-hidden="true" className="size-5" />
          </button>
        )}
      </div>

      <div
        ref={scroller}
        onScroll={(e) => {
          const el = e.currentTarget;
          setIndex(Math.round(el.scrollLeft / el.clientWidth));
        }}
        className="relative z-10 flex min-h-0 flex-1 snap-x snap-mandatory overflow-x-auto [scrollbar-width:none]"
      >
        {cards.map((c) => (
          <section
            key={c.id}
            aria-label={c.id}
            className="mx-auto h-full w-full shrink-0 snap-center overflow-y-auto px-screen pt-6 pb-6"
          >
            <div className="mx-auto max-w-[520px]">{c.node}</div>
          </section>
        ))}
      </div>

      <div
        className="relative z-10 mx-auto flex w-full max-w-[560px] gap-2 px-screen pt-3"
        style={{ paddingBottom: "max(var(--safe-bottom), 16px)" }}
      >
        {index > 0 && (
          <Button
            variant="secondary"
            size="lg"
            onClick={() => {
              go(index - 1);
            }}
          >
            Back
          </Button>
        )}
        <Button
          size="lg"
          // On the backup card, backing up is the main action, so moving on is quieter
          variant={cards[index]?.id === "backup" ? "secondary" : "primary"}
          className="flex-1"
          onClick={() => {
            if (index >= last) onFinish();
            else go(index + 1);
          }}
        >
          {index >= last ? finishLabel : "Next"}
        </Button>
      </div>
    </div>
  );
}

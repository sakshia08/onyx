import { Amount } from "@/components/Amount";
import { PigIllustration } from "@/components/PigIllustration";
import { piggyBalance, piggyProgress, piggyStatus } from "@/domain/piggy";
import { daysToGo, startedNewCycle } from "@/domain/piggy-actions";
import type { DayKey, Piggy } from "@/domain/types";
import { cn } from "@/lib/cn";
import { countdown, statusLabel } from "./piggy-text";

interface PiggyHeroProps {
  piggy: Piggy;
  today: DayKey;
  stashSignal: number;
  wiggleSignal: number;
  pigWidth?: number;
}

/** The big pig, filling to the piggy's progress, with its balance and status (PRD §8.6). */
export function PiggyHero({
  piggy,
  today,
  stashSignal,
  wiggleSignal,
  pigWidth = 236,
}: PiggyHeroProps) {
  const balance = piggyBalance(piggy);
  const status = statusLabel(piggyStatus(piggy, today));
  const left = countdown(daysToGo(piggy, today));

  return (
    <div className="flex flex-col items-center text-center">
      <PigIllustration
        progress={piggyProgress(piggy)}
        stashSignal={stashSignal}
        wiggleSignal={wiggleSignal}
        width={pigWidth}
      />
      <p className="micro-label mt-5">
        <span aria-hidden="true">{piggy.emoji} </span>
        {piggy.name}
      </p>
      <Amount value={balance} size="display" rounded animated className="mt-1" />
      <p className="mt-1 text-callout text-text-2">
        of <Amount value={piggy.target} size="callout" tone="inherit" rounded />
        {left !== "" && ` · ${left}`}
      </p>
      <span
        className={cn(
          "mt-3 rounded-pill px-3 py-1 text-caption",
          status.tone === "good" && "bg-positive/14 text-positive",
          status.tone === "warn" && "bg-warning/14 text-warning",
          status.tone === "plain" && "bg-surface-2 text-text-2",
        )}
      >
        {status.text}
      </span>
      {startedNewCycle(piggy, today) && (
        <p className="mt-2 text-caption text-text-3">New cycle started</p>
      )}
    </div>
  );
}

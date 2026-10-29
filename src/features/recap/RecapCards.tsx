import { ArrowDown, ArrowUp, Check } from "lucide-react";
import { useState } from "react";
import { Amount } from "@/components/Amount";
import { Button } from "@/components/Button";
import { ProgressRing } from "@/components/ProgressRing";
import { Tank, TankPill } from "@/components/Tank";
import { bucketColorVar, bucketTint } from "@/components/bucket-color";
import { format } from "date-fns";
import { fromISODate, monthName } from "@/domain/dates";
import type { MonthRecap } from "@/domain/recap";
import { appStore } from "@/store";
import { backupDone } from "@/store/actions";
import { shareBackup } from "@/lib/share-backup";
import { cn } from "@/lib/cn";

export function CardTitle({ kicker, title }: { kicker: string; title: React.ReactNode }) {
  return (
    <div>
      <p className="micro-label">{kicker}</p>
      <h2 className="mt-1 text-title text-text-1">{title}</h2>
    </div>
  );
}

/** 1. "October in review": budget, used, and left (or over). */
export function ReviewCard({ recap }: { recap: MonthRecap }) {
  const over = recap.left < 0;
  return (
    <div className="flex flex-col gap-5">
      <CardTitle kicker="Month in review" title={`${monthName(recap.key)} in review`} />
      <Tank
        label={`${monthName(recap.key)} left`}
        level={recap.budget > 0 ? Math.max(0, recap.left) / recap.budget : 0}
        color="var(--liquid)"
        over={over}
        header={
          <>
            <p className="micro-label text-text-1/85">{over ? "Over budget" : "Left"}</p>
            <TankPill>{over ? "Over" : "Within budget"}</TankPill>
          </>
        }
        footer={
          <p className="text-callout text-text-1">
            <Amount value={recap.used} size="callout" tone="inherit" className="font-normal" /> used
            of <Amount value={recap.budget} size="callout" tone="inherit" className="font-normal" />
          </p>
        }
      >
        <Amount value={recap.left} size="hero" className="mt-2" />
      </Tank>
      <p className="text-body text-text-2">
        {over
          ? "It went over this time. A new month is a fresh start."
          : "You stayed within budget. Nicely done."}
      </p>
    </div>
  );
}

/** 2. Buckets: which stayed within budget, and which went over and by how much. */
export function BucketsCard({ recap }: { recap: MonthRecap }) {
  return (
    <div className="flex flex-col gap-5">
      <CardTitle kicker="Buckets" title="How each bucket did" />
      <div className="flex flex-col gap-2">
        {recap.over.map((r) => (
          <Row
            key={r.bucket.id}
            emoji={r.bucket.emoji}
            tint={bucketTint(r.bucket.color)}
            name={r.bucket.name}
          >
            <span className="text-callout text-negative">
              Over by <Amount value={-r.remaining} size="callout" tone="inherit" />
            </span>
          </Row>
        ))}
        {recap.within.map((r) => (
          <Row
            key={r.bucket.id}
            emoji={r.bucket.emoji}
            tint={bucketTint(r.bucket.color)}
            name={r.bucket.name}
          >
            {r.bucket.allocated === 0 && r.used === 0 ? (
              <span className="text-callout text-text-3">₹0 budget</span>
            ) : (
              <span className="flex items-center gap-1 text-callout text-text-2">
                <Check aria-hidden="true" className="size-4 text-positive" />
                <Amount value={r.remaining} size="callout" tone="inherit" /> left
              </span>
            )}
          </Row>
        ))}
        {recap.saved.map((r) => (
          <Row
            key={r.bucket.id}
            emoji={r.bucket.emoji}
            tint={bucketTint(r.bucket.color)}
            name={r.bucket.name}
          >
            <span className="text-callout text-text-2">
              <Amount value={r.used} size="callout" tone="inherit" /> put away
            </span>
          </Row>
        ))}
      </div>
    </div>
  );
}

/** 3. The biggest expense and the most-used bucket. */
export function HighlightsCard({ recap }: { recap: MonthRecap }) {
  const bucketOf = (id: string) =>
    [...recap.within, ...recap.over].find((r) => r.bucket.id === id)?.bucket;
  const biggestBucket = recap.biggest ? bucketOf(recap.biggest.bucketId) : undefined;
  return (
    <div className="flex flex-col gap-5">
      <CardTitle kicker="Highlights" title="The month in two numbers" />
      {recap.biggest ? (
        <div className="rounded-card border border-hairline bg-surface-1 p-5">
          <p className="micro-label">Biggest expense</p>
          <Amount value={recap.biggest.amount} size="display" className="mt-2" />
          <p className="mt-1 text-body text-text-1">
            {biggestBucket?.emoji} {recap.biggest.note ?? biggestBucket?.name}
          </p>
          <p className="text-caption text-text-3">
            {format(fromISODate(recap.biggest.date), "EEE d MMM")} · {biggestBucket?.name}
          </p>
        </div>
      ) : (
        <p className="text-body text-text-2">No spending logged this month.</p>
      )}
      {recap.mostUsed && (
        <div className="rounded-card border border-hairline bg-surface-1 p-5">
          <p className="micro-label">Most-used bucket</p>
          <div className="mt-3 flex items-center gap-3">
            <ProgressRing
              value={
                recap.mostUsed.bucket.allocated > 0
                  ? recap.mostUsed.used / recap.mostUsed.bucket.allocated
                  : 1
              }
              color={bucketColorVar(recap.mostUsed.bucket.color)}
              size={52}
            >
              <span aria-hidden="true" className="text-[22px]">
                {recap.mostUsed.bucket.emoji}
              </span>
            </ProgressRing>
            <div>
              <p className="text-headline text-text-1">{recap.mostUsed.bucket.name}</p>
              <p className="text-callout text-text-2">
                <Amount value={recap.mostUsed.used} size="callout" tone="inherit" /> used
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/** 4. Compared with the previous month: the percentage change per bucket. */
export function CompareCard({ recap }: { recap: MonthRecap }) {
  if (!recap.comparison) return null;
  return (
    <div className="flex flex-col gap-5">
      <CardTitle
        kicker="Compared"
        title={`Compared with ${monthName(recap.comparison.previousKey)}`}
      />
      <div className="flex flex-col gap-2">
        {recap.comparison.rows.map((r) => (
          <Row
            key={r.bucket.id}
            emoji={r.bucket.emoji}
            tint={bucketTint(r.bucket.color)}
            name={r.bucket.name}
          >
            <span className="flex items-center gap-2">
              <Amount value={r.used} size="callout" />
              <ChangeChip change={r.change} />
            </span>
          </Row>
        ))}
      </div>
      <p className="text-caption text-text-3">Up means more money used than last month.</p>
    </div>
  );
}

function ChangeChip({ change }: { change: number | "new" }) {
  if (change === "new") {
    return (
      <span className="rounded-pill bg-surface-2 px-2 py-0.5 text-caption text-text-2">New</span>
    );
  }
  const Icon = change > 0 ? ArrowUp : ArrowDown;
  return (
    <span className="flex min-w-14 items-center justify-end gap-0.5 rounded-pill bg-surface-2 px-2 py-0.5 text-caption text-text-2 tabular-nums">
      {change !== 0 && <Icon aria-hidden="true" className="size-3" />}
      <span className="sr-only">{change > 0 ? "up" : change < 0 ? "down" : "no change"}</span>
      {Math.abs(change)}%
    </span>
  );
}

/** 5. Piggies: the total stashed this month and the progress made. */
export function PiggiesCard({ recap }: { recap: MonthRecap }) {
  return (
    <div className="flex flex-col gap-5">
      <CardTitle
        kicker="Piggies"
        title={
          <>
            <Amount value={recap.stashed} size="title" rounded /> stashed
          </>
        }
      />
      <div className="flex flex-col gap-2">
        {recap.piggies.map(({ piggy, before, after }) => (
          <Row
            key={piggy.id}
            emoji={piggy.emoji}
            tint="color-mix(in srgb, var(--piggy) 16%, transparent)"
            name={piggy.name}
          >
            <span className="text-callout text-text-2">
              <Amount value={before} size="callout" tone="inherit" rounded /> →{" "}
              <Amount value={after} size="callout" tone="inherit" rounded className="text-text-1" />
            </span>
          </Row>
        ))}
      </div>
    </div>
  );
}

/** 6. "Back up October": one tap to save a backup file (PRD §8.8, §8.11). */
export function BackupCard({ recap }: { recap: MonthRecap }) {
  const [state, setState] = useState<"idle" | "saving" | "saved" | "cancelled" | "failed">("idle");
  return (
    <div className="flex flex-col gap-5">
      <CardTitle kicker="Backup" title={`Back up ${monthName(recap.key)}`} />
      <p className="text-body text-text-2">
        Your data lives only on this phone. Save a backup to the Files app: tap{" "}
        <strong className="font-semibold text-text-1">Save to Files</strong> and pick On My iPhone
        or iCloud Drive.
      </p>
      <Button
        size="lg"
        className="w-full"
        disabled={state === "saving" || state === "saved"}
        onClick={() => {
          setState("saving");
          void shareBackup(appStore.getState().data).then((result) => {
            if (result === "shared" || result === "downloaded") {
              backupDone();
              setState("saved");
            } else {
              setState(result);
            }
          });
        }}
      >
        {state === "saved" ? "Backed up ✓" : "Back up now"}
      </Button>
      {state === "cancelled" && (
        <p className="text-callout text-text-2">Not saved. You can try again, or skip.</p>
      )}
      {state === "failed" && (
        <p className="text-callout text-negative">
          That didn't work. Try again from Settings later.
        </p>
      )}
      <p className="text-caption text-text-3">You only need your newest backup.</p>
    </div>
  );
}

function Row({
  emoji,
  tint,
  name,
  children,
}: {
  emoji: string;
  tint: string;
  name: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-14 items-center gap-3 rounded-inner border border-hairline bg-surface-1 px-4 py-2.5">
      <span
        aria-hidden="true"
        className="grid size-9 shrink-0 place-items-center rounded-pill text-[18px]"
        style={{ backgroundColor: tint }}
      >
        {emoji}
      </span>
      <span className={cn("min-w-0 flex-1 truncate text-body text-text-1")}>{name}</span>
      {children}
    </div>
  );
}

import { Amount } from "@/components/Amount";
import { bucketColorVar } from "@/components/bucket-color";
import { Tank, TankPill } from "@/components/Tank";
import { bucketStatus, usedFraction } from "@/domain/budget";
import { spokenAmount, type Paise } from "@/domain/money";
import type { Bucket } from "@/domain/types";

interface BucketTankProps {
  bucket: Bucket;
  used: Paise;
  today: number;
  days: number;
  className?: string;
}

/** One bucket as a big tank in its own color, with the pace notch (PRD §8.5, §10.1). */
export function BucketTank({ bucket, used, today, days, className }: BucketTankProps) {
  const status = bucketStatus(bucket.kind, bucket.allocated, used, today, days);
  const share = usedFraction(bucket.allocated, used);
  const isSpend = status.kind === "spend";
  const over = isSpend && status.state === "over";
  const extra = !isSpend && status.state === "extra";
  const level = bucket.allocated > 0 ? (isSpend ? 1 - share : share) : 0;

  return (
    <Tank
      label={`${bucket.name} this month`}
      level={level}
      color={bucketColorVar(bucket.color)}
      strength={72}
      over={over}
      {...(isSpend && bucket.allocated > 0 ? { pace: 1 - today / days } : {})}
      {...(className !== undefined ? { className } : {})}
      header={
        <>
          <p className="micro-label text-text-1/85">
            {isSpend ? "Left" : extra ? "Extra put away" : "Left to put away"}
          </p>
          <TankPill>
            {isSpend ? (
              <span className="flex items-center gap-1.5">
                {status.state === "ahead" && (
                  <span aria-hidden="true" className="size-2 rounded-pill bg-warning" />
                )}
                {status.state === "over"
                  ? "Over"
                  : bucket.allocated === 0
                    ? "₹0 budget"
                    : status.state === "ahead"
                      ? "Ahead of pace"
                      : "On pace"}
              </span>
            ) : status.state === "left" ? (
              "Save"
            ) : status.state === "done" ? (
              "All put away"
            ) : (
              "Goal met"
            )}
          </TankPill>
        </>
      }
      footer={
        <p className="text-callout text-text-1">
          <Amount value={used} size="callout" tone="inherit" className="font-normal" />{" "}
          {isSpend ? "used of" : "put away of"}{" "}
          <Amount value={bucket.allocated} size="callout" tone="inherit" className="font-normal" />
        </p>
      }
    >
      <Amount
        value={extra ? -status.remaining : status.remaining}
        size="hero"
        signDisplay={extra ? "always" : "auto"}
        tone={over ? "negative" : "default"}
        animated
        className="mt-2"
        {...(over ? { label: `Over by ${spokenAmount(-status.remaining)}` } : {})}
        {...(extra ? { label: `${spokenAmount(-status.remaining)} extra put away` } : {})}
      />
    </Tank>
  );
}

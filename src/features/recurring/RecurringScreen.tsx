import { CircleAlert, Plus, Repeat } from "lucide-react";
import { motion } from "motion/react";
import { useNavigate } from "react-router";
import { Screen } from "@/app/Screen";
import { Amount } from "@/components/Amount";
import { Button } from "@/components/Button";
import { bucketTint } from "@/components/bucket-color";
import type { RecurringRule } from "@/domain/types";
import { tapScale } from "@/lib/motion";
import { cn } from "@/lib/cn";
import { useActiveMonth } from "@/store/hooks";
import { useAppStore } from "@/store";
import { BackButton } from "../setup/BackButton";

/** Recurring expenses (PRD §8.7): rent, SIP, Netflix… logged on their day every month. */
export function RecurringScreen() {
  const navigate = useNavigate();
  const rules = useAppStore((s) => s.data.recurring);
  const month = useActiveMonth();
  const sorted = [...rules].sort((a, b) => a.dayOfMonth - b.dayOfMonth);

  return (
    <Screen>
      <BackButton
        onClick={() => {
          void navigate(-1);
        }}
      />
      <header className="mt-2 flex items-center justify-between">
        <h1 className="text-title text-text-1">Recurring</h1>
        <Button
          variant="secondary"
          onClick={() => {
            void navigate("/recurring/new");
          }}
        >
          <Plus aria-hidden="true" className="size-4" strokeWidth={2.5} />
          New
        </Button>
      </header>

      {sorted.length === 0 ? (
        <div className="mt-section flex flex-col items-center rounded-card border border-dashed border-hairline-strong px-6 py-8 text-center">
          <Repeat aria-hidden="true" className="size-8 text-text-3" />
          <p className="mt-3 text-body text-text-1">Nothing recurring yet</p>
          <p className="mt-1 text-callout text-text-2">
            Rent, a SIP, Netflix: add them once and Onyx logs them on their day every month.
          </p>
        </div>
      ) : (
        <div className="mt-section flex flex-col gap-2">
          {sorted.map((rule) => (
            <RuleRow
              key={rule.id}
              rule={rule}
              bucket={month?.buckets.find((b) => b.id === rule.bucketId)}
              onClick={() => {
                void navigate(`/recurring/${rule.id}`);
              }}
            />
          ))}
        </div>
      )}
    </Screen>
  );
}

function RuleRow({
  rule,
  bucket,
  onClick,
}: {
  rule: RecurringRule;
  bucket: { name: string; emoji: string; color: Parameters<typeof bucketTint>[0] } | undefined;
  onClick: () => void;
}) {
  return (
    <motion.button
      type="button"
      whileTap={tapScale}
      onClick={onClick}
      className={cn(
        "flex min-h-[68px] w-full items-center gap-3 rounded-card border border-hairline bg-surface-1 px-4 py-3 text-left",
        !rule.active && "opacity-60",
      )}
    >
      <span className="flex size-11 shrink-0 flex-col items-center justify-center rounded-inner bg-surface-2 leading-none">
        <span className="text-micro font-semibold tracking-normal text-text-3">DAY</span>
        <span className="text-headline text-text-1 tabular-nums">{rule.dayOfMonth}</span>
      </span>
      <span className="flex min-w-0 flex-1 flex-col">
        <span className="truncate text-body text-text-1">{rule.name}</span>
        <span
          className={cn(
            "flex items-center gap-1 truncate text-caption",
            bucket ? "text-text-3" : "text-warning",
          )}
        >
          {bucket ? (
            <>
              {bucket.emoji} {bucket.name} ·{" "}
              {rule.mode === "auto" ? "Logs automatically" : "Asks first"}
              {!rule.active && " · Paused"}
            </>
          ) : (
            <>
              <CircleAlert aria-hidden="true" className="size-3.5" /> Needs a bucket
            </>
          )}
        </span>
      </span>
      <Amount value={rule.amount} size="headline" />
    </motion.button>
  );
}

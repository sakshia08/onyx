import { Trash2 } from "lucide-react";
import { useState } from "react";
import { useNavigate, useParams } from "react-router";
import { Amount } from "@/components/Amount";
import { AmountSheet } from "@/components/AmountSheet";
import { Button } from "@/components/Button";
import { Chip } from "@/components/Chip";
import { SegmentedControl } from "@/components/SegmentedControl";
import { TextField } from "@/components/TextField";
import { Toggle } from "@/components/Toggle";
import { useToast } from "@/components/toast-context";
import { dayInMonth } from "@/domain/dates";
import { formatAmount } from "@/domain/money";
import { missedWhenCreated, ruleProblem, type RuleDraft } from "@/domain/recurring";
import { bucketsForHome } from "@/domain/setup";
import type { RecurringRule } from "@/domain/types";
import { cn } from "@/lib/cn";
import { addRule, deleteRule, logRule, putBackRule, saveRule } from "@/store/actions";
import { useActiveMonth } from "@/store/hooks";
import { useAppStore } from "@/store";
import { BackButton } from "../setup/BackButton";
import { FullScreen } from "../setup/FullScreen";

const MODES = [
  { value: "auto", label: "Log automatically" },
  { value: "ask", label: "Ask me first" },
] as const satisfies readonly { value: RecurringRule["mode"]; label: string }[];

const PROBLEM_TEXT = {
  "name-missing": "Give it a name.",
  amount: "Set the amount.",
  bucket: "Choose a bucket.",
  day: "Pick a day.",
} as const;

/** Add or edit a recurring expense (PRD §8.7), at /recurring/new and /recurring/:id. */
export function RuleEditor() {
  const { id } = useParams();
  const existing = useAppStore((s) => s.data.recurring.find((r) => r.id === id));
  return <RuleForm key={existing?.id ?? "new"} existing={existing} />;
}

function RuleForm({ existing }: { existing: RecurringRule | undefined }) {
  const navigate = useNavigate();
  const toast = useToast();
  const month = useActiveMonth();
  const buckets = month
    ? [...bucketsForHome(month.buckets).spend, ...bucketsForHome(month.buckets).save]
    : [];
  const [draft, setDraft] = useState<RuleDraft>(() => ({
    name: existing?.name ?? "",
    amount: existing?.amount ?? 0,
    bucketId: existing?.bucketId ?? "",
    dayOfMonth: existing?.dayOfMonth ?? 1,
    mode: existing?.mode ?? "auto",
    active: existing?.active ?? true,
  }));
  const [amountOpen, setAmountOpen] = useState(false);
  const [tried, setTried] = useState(false);
  const problem = ruleProblem(
    draft,
    buckets.map((b) => b.id),
  );
  const set = (change: Partial<RuleDraft>) => {
    setDraft((d) => ({ ...d, ...change }));
  };
  const back = () => {
    void navigate("/recurring", { replace: true });
  };

  const save = () => {
    setTried(true);
    if (problem !== null || !month) return;
    if (existing) {
      saveRule(existing.id, draft);
      back();
      return;
    }
    const rule = addRule(draft);
    back();
    // Created after its day this month: ask whether to log it now (PRD §13)
    if (rule.active && missedWhenCreated(rule, month, dayInMonth(month.key, new Date()))) {
      toast.show({
        tone: "info",
        duration: 10_000,
        message: `${rule.name}'s day has passed this month. Log ${formatAmount(rule.amount)} now?`,
        action: {
          label: "Log",
          onAction: () => {
            logRule(rule.id);
          },
        },
      });
    }
  };

  return (
    <FullScreen
      footer={
        <div className="flex flex-col gap-2">
          {tried && problem !== null && (
            <p className="text-center text-callout text-negative">{PROBLEM_TEXT[problem]}</p>
          )}
          <Button size="lg" className="w-full" onClick={save}>
            {existing ? "Save" : "Add recurring expense"}
          </Button>
        </div>
      }
    >
      <BackButton label="Recurring" onClick={back} />
      <h1 className="mt-2 text-title text-text-1">
        {existing ? "Edit recurring" : "New recurring"}
      </h1>

      <div className="mt-5 flex flex-col gap-5">
        <TextField
          label="Name"
          placeholder="e.g. Rent, Netflix, SIP"
          value={draft.name}
          maxLength={40}
          autoComplete="off"
          onChange={(e) => {
            set({ name: e.target.value });
          }}
        />

        <button
          type="button"
          onClick={() => {
            setAmountOpen(true);
          }}
          className="flex min-h-14 items-center justify-between rounded-inner border border-hairline bg-surface-2 px-4"
        >
          <span className="text-body text-text-1">Amount</span>
          {draft.amount > 0 ? (
            <Amount value={draft.amount} size="headline" />
          ) : (
            <span className="text-body text-text-3">Set amount</span>
          )}
        </button>

        <div>
          <p className="mb-2 text-callout text-text-2">Bucket</p>
          <div className="flex flex-wrap gap-2" role="group" aria-label="Bucket">
            {buckets.map((b) => (
              <Chip
                key={b.id}
                color={b.color}
                leading={b.emoji}
                selected={draft.bucketId === b.id}
                onClick={() => {
                  set({ bucketId: b.id });
                }}
              >
                {b.name}
              </Chip>
            ))}
          </div>
        </div>

        <div>
          <p className="mb-2 text-callout text-text-2">Day of the month</p>
          <div role="radiogroup" aria-label="Day of the month" className="grid grid-cols-7 gap-1">
            {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => (
              <button
                key={day}
                type="button"
                role="radio"
                aria-checked={draft.dayOfMonth === day}
                onClick={() => {
                  set({ dayOfMonth: day });
                }}
                className={cn(
                  "grid h-11 place-items-center rounded-pill text-body tabular-nums",
                  draft.dayOfMonth === day
                    ? "bg-text-1 text-bg"
                    : "text-text-1 active:bg-surface-3",
                )}
              >
                {day}
              </button>
            ))}
          </div>
          {draft.dayOfMonth > 28 && (
            <p className="mt-2 text-caption text-text-3">
              In shorter months it moves to the last day.
            </p>
          )}
        </div>

        <SegmentedControl
          label="When it's due"
          options={MODES}
          value={draft.mode}
          onChange={(mode) => {
            set({ mode });
          }}
        />
        <p className="-mt-3 px-1 text-caption text-text-3">
          {draft.mode === "auto"
            ? "Logged on its day at 09:00."
            : "Shows under Due now on Home, with Log and Skip."}
        </p>

        {existing && (
          <Toggle
            label="Active"
            description="Paused rules aren't logged or counted"
            checked={draft.active}
            onChange={(active) => {
              set({ active });
            }}
          />
        )}

        {existing && (
          <Button
            variant="ghost"
            className="self-center text-negative"
            onClick={() => {
              const removed = deleteRule(existing.id);
              back();
              if (removed) {
                toast.show({
                  tone: "info",
                  message: `${removed.name} deleted. Entries it logged stay.`,
                  action: {
                    label: "Undo",
                    onAction: () => {
                      putBackRule(removed);
                    },
                  },
                });
              }
            }}
          >
            <Trash2 aria-hidden="true" className="size-4" />
            Delete
          </Button>
        )}
      </div>

      <AmountSheet
        key={String(amountOpen)}
        open={amountOpen}
        onOpenChange={setAmountOpen}
        title="Amount"
        initial={draft.amount}
        onSave={(amount) => {
          set({ amount });
        }}
      />
    </FullScreen>
  );
}

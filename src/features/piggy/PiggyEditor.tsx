import { shownAmount } from "@/lib/shown-amount";
import { ChevronRight } from "lucide-react";
import { useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router";
import { Amount } from "@/components/Amount";
import { AmountSheet } from "@/components/AmountSheet";
import { Button } from "@/components/Button";
import { Chip } from "@/components/Chip";
import { SegmentedControl } from "@/components/SegmentedControl";
import { TextField } from "@/components/TextField";
import { Toggle } from "@/components/Toggle";
import { dayKeyOfDate } from "@/domain/dates";
import { type Paise } from "@/domain/money";
import {
  MAX_PIGGY_NAME,
  monthlyPreview,
  PIGGY_TEMPLATES,
  piggyProblem,
  type PiggyDraft,
} from "@/domain/piggy-actions";
import type { Piggy } from "@/domain/types";
import { addPiggy, savePiggy } from "@/store/actions";
import { useAppStore } from "@/store";
import { EmojiPicker } from "../buckets/EmojiPicker";
import { BackButton } from "../setup/BackButton";
import { FullScreen } from "../setup/FullScreen";

const REPEAT = [
  { value: "none", label: "One-time" },
  { value: "yearly", label: "Every year" },
] as const satisfies readonly { value: Piggy["repeat"]; label: string }[];

const PROBLEM_TEXT = {
  "name-missing": "Give it a name.",
  target: "Set a target amount.",
  "date-past": "Pick a date from today on.",
  "yearly-needs-date": "A yearly piggy needs a date.",
  opening: "That amount doesn't look right.",
} as const;

/** Create or edit a piggy (PRD §8.6), at /piggy/new and /piggy/:id/edit. */
export function PiggyEditor() {
  const { id } = useParams();
  const existing = useAppStore((s) => s.data.piggies.find((p) => p.id === id));
  // Remount per piggy, so the form always starts from what's saved
  return <EditorForm key={existing?.id ?? "new"} existing={existing} />;
}

function EditorForm({ existing }: { existing: Piggy | undefined }) {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const template = PIGGY_TEMPLATES[Number(params.get("template") ?? -1)];
  const today = dayKeyOfDate(new Date());

  const [draft, setDraft] = useState<PiggyDraft>(() => ({
    name: existing?.name ?? template?.name ?? "",
    emoji: existing?.emoji ?? template?.emoji ?? "🐷",
    target: existing?.target ?? 0,
    repeat: existing?.repeat ?? template?.repeat ?? "none",
    autoStash: existing?.autoStash ?? false,
    ...(existing?.targetDate !== undefined ? { targetDate: existing.targetDate } : {}),
  }));
  const [opening, setOpening] = useState<Paise>(0);
  const [sheet, setSheet] = useState<"target" | "opening" | null>(null);
  const [emojiOpen, setEmojiOpen] = useState(false);
  const [tried, setTried] = useState(false);

  const problem = piggyProblem(draft, opening, today);
  const preview = monthlyPreview(draft.target, existing ? 0 : opening, draft.targetDate, today);
  const set = (change: Partial<PiggyDraft>) => {
    setDraft((d) => ({ ...d, ...change }));
  };

  const save = () => {
    setTried(true);
    if (problem !== null) return;
    if (existing) {
      savePiggy(existing.id, draft);
      void navigate(`/piggy/${existing.id}`, { replace: true });
    } else {
      const piggy = addPiggy(draft, opening);
      void navigate(`/piggy/${piggy.id}`, { replace: true });
    }
  };

  return (
    <FullScreen
      footer={
        <div className="flex flex-col gap-2">
          {tried && problem !== null && (
            <p className="text-center text-callout text-negative">{PROBLEM_TEXT[problem]}</p>
          )}
          <Button variant="piggy" size="lg" className="w-full" onClick={save}>
            {existing ? "Save" : "Create piggy"}
          </Button>
        </div>
      }
    >
      <BackButton
        label={existing ? existing.name : "Piggy"}
        onClick={() => {
          void navigate(-1);
        }}
      />
      <h1 className="mt-2 text-title text-text-1">{existing ? "Edit piggy" : "New piggy"}</h1>

      {!existing && (
        <div className="relative -mx-screen mt-4 flex gap-2 overflow-x-auto px-screen py-1 [scrollbar-width:none]">
          {PIGGY_TEMPLATES.map((t) => (
            <Chip
              key={t.name}
              leading={t.emoji}
              selected={draft.name === t.name && draft.emoji === t.emoji}
              onClick={() => {
                set({ name: t.name, emoji: t.emoji, repeat: t.repeat });
              }}
            >
              {t.name}
            </Chip>
          ))}
        </div>
      )}

      <div className="mt-5 flex flex-col gap-4">
        <div className="flex items-start gap-3">
          <button
            type="button"
            aria-label={`Emoji: ${draft.emoji}. Change it`}
            aria-expanded={emojiOpen}
            onClick={() => {
              setEmojiOpen(!emojiOpen);
            }}
            className="grid size-14 shrink-0 place-items-center rounded-inner border border-hairline bg-piggy/14 text-[28px] leading-none"
          >
            {draft.emoji}
          </button>
          <TextField
            label="Name"
            hideLabel
            placeholder="What are you saving for?"
            value={draft.name}
            maxLength={MAX_PIGGY_NAME}
            autoComplete="off"
            error={tried && problem === "name-missing" ? PROBLEM_TEXT["name-missing"] : null}
            onChange={(e) => {
              set({ name: e.target.value });
            }}
            className="flex-1"
          />
        </div>
        {emojiOpen && (
          <EmojiPicker
            value={draft.emoji}
            onPick={(emoji) => {
              set({ emoji });
              setEmojiOpen(false);
            }}
          />
        )}

        <AmountRow
          label="Target"
          value={draft.target}
          placeholder="Set amount"
          onClick={() => {
            setSheet("target");
          }}
        />

        <div className="flex flex-col gap-2">
          <div className="flex items-end gap-2">
            <TextField
              label="By when? (optional)"
              type="date"
              min={today}
              value={draft.targetDate ?? ""}
              onChange={(e) => {
                const value = e.target.value;
                setDraft((d) => {
                  const next = { ...d };
                  if (value === "") delete next.targetDate;
                  else next.targetDate = value;
                  return next;
                });
              }}
              className="flex-1"
            />
            {draft.targetDate !== undefined && (
              <Button
                variant="ghost"
                className="mb-1.5"
                onClick={() => {
                  setDraft((d) => {
                    const next = { ...d };
                    delete next.targetDate;
                    return next;
                  });
                }}
              >
                No date
              </Button>
            )}
          </div>
          <SegmentedControl
            label="Repeat"
            options={REPEAT}
            value={draft.repeat}
            onChange={(repeat) => {
              set({ repeat });
            }}
          />
        </div>

        {!existing && (
          <AmountRow
            label="Already saved"
            value={opening}
            placeholder="₹0"
            onClick={() => {
              setSheet("opening");
            }}
          />
        )}

        <Toggle
          label="Auto-stash"
          description="Stash the planned amount on the 1st of each month"
          checked={draft.autoStash}
          onChange={(autoStash) => {
            set({ autoStash });
          }}
        />

        <p className="rounded-inner bg-piggy/10 px-4 py-3 text-callout text-text-1">
          {preview
            ? preview.perMonth === 0
              ? "Already fully saved."
              : `${shownAmount(preview.perMonth)}/month for ${String(preview.months)} ${preview.months === 1 ? "month" : "months"}`
            : "No date: just progress, no monthly amount."}
        </p>
      </div>

      <AmountSheet
        key={sheet ?? "none"}
        open={sheet !== null}
        onOpenChange={(open) => {
          if (!open) setSheet(null);
        }}
        title={sheet === "opening" ? "Already saved" : "Target"}
        initial={sheet === "opening" ? opening : draft.target}
        allowZero={sheet === "opening"}
        onSave={(amount) => {
          if (sheet === "opening") setOpening(amount);
          else set({ target: amount });
        }}
      />
    </FullScreen>
  );
}

function AmountRow({
  label,
  value,
  placeholder,
  onClick,
}: {
  label: string;
  value: Paise;
  placeholder: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex min-h-14 items-center justify-between rounded-inner border border-hairline bg-surface-2 px-4 text-left"
    >
      <span className="text-body text-text-1">{label}</span>
      <span className="flex items-center gap-1">
        {value > 0 ? (
          <Amount value={value} size="headline" rounded />
        ) : (
          <span className="text-body text-text-3">{placeholder}</span>
        )}
        <ChevronRight aria-hidden="true" className="size-4 text-text-3" />
      </span>
    </button>
  );
}

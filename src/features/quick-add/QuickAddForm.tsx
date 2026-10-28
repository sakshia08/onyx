import { Check, Trash2 } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useMemo, useState } from "react";
import { AmountInputDisplay } from "@/components/AmountInputDisplay";
import { Button } from "@/components/Button";
import { Chip } from "@/components/Chip";
import { Keypad } from "@/components/Keypad";
import { QuickLogChip } from "@/components/QuickLogChip";
import { SegmentedControl } from "@/components/SegmentedControl";
import { dayLabel } from "@/domain/activity";
import {
  dayInMonth,
  dayKeyOf,
  dayKeyOfDate,
  daysInMonth,
  isoForDay,
  toISODate,
} from "@/domain/dates";
import { dateForDay } from "@/domain/entries";
import { applyKeyToSaved, evaluate, paiseToInput } from "@/domain/expression";
import { entryFromFavorite, usableFavorites } from "@/domain/favorites";
import { formatAmount, MAX_ENTRY_PAISE } from "@/domain/money";
import { bucketsForHome } from "@/domain/setup";
import { bucketForNote, noteSuggestions } from "@/domain/suggestions";
import type { Entry, EntryType, ID } from "@/domain/types";
import { newId } from "@/lib/id";
import { deleteEntry, editEntry, logEntry } from "@/store/actions";
import { useActiveMonth } from "@/store/hooks";
import { useAppStore } from "@/store";
import { DayPicker } from "./DayPicker";
import { NoteField } from "./NoteField";
import type { QuickAddRequest } from "./QuickAddSheet";
import { useEntryFeedback } from "./use-entry-feedback";

const TYPES = [
  { value: "expense", label: "Expense" },
  { value: "refund", label: "Money back" },
] as const satisfies readonly { value: EntryType; label: string }[];

const AMOUNT_PROBLEM: Partial<Record<string, string>> = {
  negative: "The total can't be below ₹0.",
  "too-large": `Up to ${formatAmount(MAX_ENTRY_PAISE)} per entry.`,
};

/** How long the ✓ shows before the sheet closes (PRD §8.4: a short success animation). */
const SUCCESS_MS = 320;

/**
 * Quick add (PRD §8.4): amount → destination → note (optional) → ✓.
 * The same form edits an entry (PRD §8.5), with Delete.
 */
export function QuickAddForm({
  request,
  onDone,
}: {
  request: QuickAddRequest;
  onDone: () => void;
}) {
  const month = useActiveMonth();
  const favorites = useAppStore((s) => s.data.favorites);
  const months = useAppStore((s) => s.data.months);
  const feedback = useEntryFeedback();
  const [now] = useState(() => new Date());

  const editing = request.mode === "edit" ? request.entry : null;
  const [type, setType] = useState<EntryType>(editing?.type ?? "expense");
  const [input, setInput] = useState(editing ? paiseToInput(editing.amount) : "");
  const [fresh, setFresh] = useState(editing !== null);
  const [bucketId, setBucketId] = useState<ID | null>(
    editing?.bucketId ?? (request.mode === "add" ? (request.bucketId ?? null) : null),
  );
  const [note, setNote] = useState(editing?.note ?? "");
  const [day, setDay] = useState(() =>
    editing ? Number(editing.date.slice(8, 10)) : month ? dayInMonth(month.key, now) : 1,
  );
  const [panel, setPanel] = useState<"keypad" | "days" | "delete">("keypad");
  const [saved, setSaved] = useState(false);

  // Every note ever logged, for suggestions (computed, never stored: PRD §11)
  const allEntries = useMemo(() => Object.values(months).flatMap((m) => m.entries), [months]);

  if (month === null) return null;
  const grouped = bucketsForHome(month.buckets);
  const buckets = [...grouped.spend, ...grouped.save];
  const today = dayInMonth(month.key, now);
  const result = evaluate(input);
  const canSave = result.ok && bucketId !== null && buckets.some((b) => b.id === bucketId);
  const suggestions = noteSuggestions(
    allEntries,
    note,
    note.trim() === "" ? (bucketId ?? undefined) : undefined,
  );
  const quickFavorites = editing ? [] : usableFavorites(favorites, month);

  const finish = (after: () => void) => {
    setSaved(true);
    window.setTimeout(() => {
      onDone();
      after();
    }, SUCCESS_MS);
  };

  const save = () => {
    if (!result.ok || bucketId === null || saved) return;
    const trimmed = note.trim();
    const base = {
      type,
      bucketId,
      amount: result.value,
      date: dateForDay(month.key, day, editing ? editing.date : new Date()),
    };
    if (editing) {
      const entry: Entry = { ...editing, ...base };
      if (trimmed === "") delete entry.note;
      else entry.note = trimmed;
      const headsUp = editEntry(entry);
      finish(() => {
        feedback.edited(editing, headsUp);
      });
    } else {
      const nowIso = toISODate(new Date());
      const entry: Entry = {
        id: newId(),
        ...base,
        ...(trimmed !== "" ? { note: trimmed } : {}),
        createdAt: nowIso,
        source: "manual",
      };
      const headsUp = logEntry(entry);
      finish(() => {
        feedback.logged(entry, headsUp);
      });
    }
  };

  const pickSuggestion = (suggestion: string) => {
    setNote(suggestion);
    // A known note picks its usual bucket, if none is chosen yet (PRD §8.4)
    if (bucketId === null) {
      const usual = bucketForNote(allEntries, suggestion);
      if (usual !== null && buckets.some((b) => b.id === usual)) setBucketId(usual);
    }
  };

  const chosenDayKey = dayKeyOf(isoForDay(month.key, day));

  return (
    <div className="relative flex flex-col gap-3 pb-2">
      {quickFavorites.length > 0 && type === "expense" && (
        <div
          className="relative -mx-screen flex gap-2 overflow-x-auto px-screen pb-1 [scrollbar-width:none]"
          aria-label="Favorites"
        >
          {quickFavorites.map((f) => (
            <QuickLogChip
              key={f.id}
              emoji={f.emoji ?? "⭐"}
              label={f.label}
              amount={f.amount}
              onClick={() => {
                const entry = entryFromFavorite(f, newId(), toISODate(new Date()));
                const headsUp = logEntry(entry);
                finish(() => {
                  feedback.logged(entry, headsUp);
                });
              }}
            />
          ))}
        </div>
      )}

      <SegmentedControl
        label="Entry type"
        options={TYPES}
        value={type}
        onChange={(t) => {
          setType(t);
        }}
      />

      <div className="py-2">
        <AmountInputDisplay input={input} selected={fresh} />
        <p className="h-[18px] text-center text-caption text-negative" aria-live="polite">
          {!result.ok ? (AMOUNT_PROBLEM[result.reason] ?? "") : ""}
        </p>
      </div>

      <div
        role="group"
        aria-label={type === "refund" ? "Money back into" : "Bucket"}
        className="relative -mx-screen flex gap-2 overflow-x-auto px-screen py-1 [scrollbar-width:none]"
      >
        {buckets.map((b) => (
          <Chip
            key={b.id}
            color={b.color}
            leading={b.emoji}
            selected={bucketId === b.id}
            onClick={() => {
              setBucketId(b.id);
            }}
          >
            {b.name}
          </Chip>
        ))}
      </div>

      <NoteField
        value={note}
        onChange={setNote}
        suggestions={suggestions}
        onPickSuggestion={pickSuggestion}
        dayLabel={dayLabel(chosenDayKey, dayKeyOfDate(now))}
        onOpenDays={() => {
          setPanel(panel === "days" ? "keypad" : "days");
        }}
      />

      {panel === "days" && (
        <DayPicker
          monthKey={month.key}
          selected={day}
          lastDay={today}
          daysInMonth={daysInMonth(month.key)}
          onPick={(d) => {
            setDay(d);
            setPanel("keypad");
          }}
        />
      )}

      {panel === "delete" && editing && (
        <div className="flex flex-col gap-3 rounded-card border border-hairline bg-surface-2/50 p-4">
          <p className="text-body text-text-1">Delete this entry?</p>
          <div className="flex gap-2">
            <Button
              variant="secondary"
              className="flex-1"
              onClick={() => {
                setPanel("keypad");
              }}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              className="flex-1"
              onClick={() => {
                const removed = deleteEntry(editing.id);
                onDone();
                if (removed) feedback.deleted(removed);
              }}
            >
              Delete
            </Button>
          </div>
        </div>
      )}

      {panel === "keypad" && (
        <Keypad
          onKey={(key) => {
            setInput((i) => applyKeyToSaved(i, key, fresh));
            setFresh(false);
          }}
          canSubmit={canSave}
          onSubmit={save}
        />
      )}

      {editing && panel === "keypad" && (
        <Button
          variant="ghost"
          className="self-center text-negative"
          onClick={() => {
            setPanel("delete");
          }}
        >
          <Trash2 aria-hidden="true" className="size-4" />
          Delete entry
        </Button>
      )}

      <AnimatePresence>
        {saved && (
          <motion.div
            className="absolute inset-0 z-10 grid place-items-center rounded-card bg-surface-1/80"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.12 }}
          >
            <motion.span
              role="status"
              aria-label="Saved"
              className="grid size-20 place-items-center rounded-pill bg-positive text-bg"
              initial={{ scale: 0.6 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 500, damping: 22 }}
            >
              <Check aria-hidden="true" className="size-10" strokeWidth={3} />
            </motion.span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

import { useMemo } from "react";
import { useToast, type ToastOptions } from "@/components/toast-context";
import { dayKeyOfDate } from "@/domain/dates";
import type { HeadsUpToast } from "@/domain/entries";
import { formatAmount } from "@/domain/money";
import { favoriteKey, shouldSuggestFavorite } from "@/domain/suggestions";
import type { Entry, Piggy } from "@/domain/types";
import {
  addFavorite,
  deleteEntry,
  deletePiggyTxn,
  putBackEntry,
  rememberFavoriteAsked,
} from "@/store/actions";
import { appStore } from "@/store";

function bucketOf(entry: Pick<Entry, "bucketId">) {
  const { data } = appStore.getState();
  const month = data.activeMonthKey === null ? undefined : data.months[data.activeMonthKey];
  return month?.buckets.find((b) => b.id === entry.bucketId);
}

/** Heads-ups are calm: a fact, never a telling-off (PRD §3, §7.2). */
function headsUpText(headsUp: HeadsUpToast): string {
  const name = bucketOf(headsUp)?.name ?? "This bucket";
  return headsUp.threshold === 80 ? `80% of ${name} used.` : `${name} is now fully used.`;
}

/** The toasts after saving, editing or deleting an entry, each with Undo (PRD §8.4). */
export function useEntryFeedback() {
  const toast = useToast();

  return useMemo(() => {
    const withHeadsUp = (message: string, headsUp: HeadsUpToast | null): ToastOptions =>
      headsUp === null
        ? { message, tone: "success" }
        : { message: `${message}. ${headsUpText(headsUp)}`, tone: "warning", duration: 6000 };

    /** "Save as favorite?" after the same thing 3 times in 30 days, asked only once. */
    const maybeSuggestFavorite = (entry: Entry) => {
      const { data } = appStore.getState();
      const all = Object.values(data.months).flatMap((m) => m.entries);
      const today = dayKeyOfDate(new Date());
      if (
        entry.note === undefined ||
        !shouldSuggestFavorite(
          all,
          entry,
          today,
          data.favorites,
          data.meta.dismissedFavoriteSuggestions,
        )
      ) {
        return;
      }
      rememberFavoriteAsked(favoriteKey(entry.note, entry.amount, entry.bucketId));
      toast.queue({
        tone: "info",
        message: `Save “${entry.note.trim()} · ${formatAmount(entry.amount)}” as a favorite?`,
        duration: 8000,
        action: {
          label: "Save",
          onAction: () => {
            addFavorite(entry, bucketOf(entry)?.emoji);
          },
        },
      });
    };

    return {
      logged(entry: Entry, headsUp: HeadsUpToast | null) {
        const name = bucketOf(entry)?.name ?? "bucket";
        // "Starbucks ₹500 logged to Food", or without a name "₹500 logged to Food"
        const what = entry.note?.trim()
          ? `${entry.note.trim()} ${formatAmount(entry.amount)}`
          : formatAmount(entry.amount);
        const message =
          entry.type === "refund" ? `${what} money back to ${name}` : `${what} logged to ${name}`;
        toast.show({
          ...withHeadsUp(message, headsUp),
          action: {
            label: "Undo",
            onAction: () => {
              deleteEntry(entry.id);
            },
          },
        });
        if (entry.type === "expense") maybeSuggestFavorite(entry);
      },

      edited(original: Entry, headsUp: HeadsUpToast | null) {
        toast.show({
          ...withHeadsUp("Entry updated", headsUp),
          action: {
            label: "Undo",
            onAction: () => {
              putBackEntry(original);
            },
          },
        });
      },

      spentFromPiggy(piggy: Piggy, amount: number, note: string, txnId: string) {
        const what = note !== "" ? `${note} ${formatAmount(amount)}` : formatAmount(amount);
        toast.show({
          tone: "success",
          message: `${what} spent from ${piggy.name}`,
          action: {
            label: "Undo",
            onAction: () => {
              deletePiggyTxn(piggy.id, txnId);
            },
          },
        });
      },

      deleted(removed: Entry) {
        toast.show({
          message: "Entry deleted",
          tone: "info",
          action: {
            label: "Undo",
            onAction: () => {
              putBackEntry(removed);
            },
          },
        });
      },
    };
  }, [toast]);
}

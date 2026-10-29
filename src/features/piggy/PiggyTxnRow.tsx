import { EntryRow } from "@/components/EntryRow";
import { SwipeToDelete } from "@/components/SwipeToDelete";
import { useToast } from "@/components/toast-context";
import { entryTime } from "@/domain/activity";
import { monthName } from "@/domain/dates";
import type { Piggy, PiggyTxn } from "@/domain/types";
import { deletePiggyTxn, putBackPiggyTxn } from "@/store/actions";

const KIND: Record<PiggyTxn["type"], string> = {
  opening: "Already saved",
  stash: "Stashed",
  leftover: "Leftover",
  spend: "Spent from piggy",
};

/** A stash or spend: the pig badge marks it (PRD §8.5). Swipe left to delete, with Undo. */
export function PiggyTxnRow({
  piggy,
  txn,
  onOpen,
  view,
}: {
  piggy: Piggy;
  txn: PiggyTxn;
  onOpen?: () => void;
  /** "month": Activity, where a stash is money out of the month. "piggy": its own history. */
  view: "month" | "piggy";
}) {
  const showPiggyName = view === "month";
  const toast = useToast();
  const kind =
    txn.type === "leftover" ? `Leftover from ${monthName(txn.monthKey)}` : KIND[txn.type];
  const title = txn.note ?? (txn.type === "spend" ? `Spent from ${piggy.name}` : kind);
  const detail = [entryTime(txn), showPiggyName ? piggy.name : null, txn.note ? kind : null]
    .filter(Boolean)
    .join(" · ");
  return (
    <SwipeToDelete
      label={title}
      onDelete={() => {
        const removed = deletePiggyTxn(piggy.id, txn.id);
        if (!removed) return;
        toast.show({
          tone: "info",
          message: "Deleted",
          action: {
            label: "Undo",
            onAction: () => {
              putBackPiggyTxn(piggy.id, removed);
            },
          },
        });
      }}
    >
      <EntryRow
        emoji={piggy.emoji}
        color="rose"
        title={title}
        detail={detail}
        amount={txn.amount}
        // In the piggy's history, money in is + and money out is −; in Activity both leave the month
        type={view === "piggy" && txn.type !== "spend" ? "refund" : "expense"}
        piggy
        {...(onOpen ? { onClick: onOpen } : {})}
      />
    </SwipeToDelete>
  );
}

import { Lock } from "lucide-react";
import { useNavigate, useParams } from "react-router";
import { Screen } from "@/app/Screen";
import { Amount } from "@/components/Amount";
import { SectionHeader } from "@/components/SectionHeader";
import { groupEntriesByDay } from "@/domain/activity";
import { dayKeyOfDate, monthName } from "@/domain/dates";
import { monthRemaining, monthUsed } from "@/domain/totals";
import { useAppStore } from "@/store";
import { DayGroups } from "../entries/EntryList";
import { BackButton } from "../setup/BackButton";

/**
 * A past month (PRD §8.9): read-only, with its full remaining amount and any leftover that
 * was moved into piggies afterwards ("₹1,000 moved to Goa trip", PRD §8.6).
 */
export function MonthDetail() {
  const { key } = useParams();
  const navigate = useNavigate();
  const data = useAppStore((s) => s.data);
  const month = key === undefined ? undefined : data.months[key];
  const back = () => {
    void navigate(-1);
  };
  if (!month) {
    return (
      <Screen>
        <BackButton label="Insights" onClick={back} />
        <p className="mt-6 text-body text-text-2">This month isn't saved.</p>
      </Screen>
    );
  }

  const moved = data.piggies.flatMap((p) =>
    p.transactions
      .filter((t) => t.type === "leftover" && t.monthKey === month.key)
      .map((t) => ({ piggy: p, txn: t })),
  );

  return (
    <Screen>
      <BackButton label="Insights" onClick={back} />
      <h1 className="mt-2 flex items-center gap-2 text-title text-text-1">
        {monthName(month.key)} {month.key.slice(0, 4)}
        <Lock aria-label="Read-only" className="size-5 text-text-3" />
      </h1>
      <p className="mt-1 text-callout text-text-2">
        <Amount value={monthUsed(month, data.piggies)} size="callout" tone="inherit" /> used of{" "}
        <Amount value={month.totalBudget} size="callout" tone="inherit" /> ·{" "}
        <Amount value={monthRemaining(month, data.piggies)} size="callout" tone="auto" /> left
      </p>
      {moved.map(({ piggy, txn }) => (
        <p key={txn.id} className="mt-1 text-callout text-piggy">
          <Amount value={txn.amount} size="callout" tone="inherit" /> moved to {piggy.name}
        </p>
      ))}

      <SectionHeader title="Entries" className="mt-section" />
      {month.entries.length === 0 ? (
        <p className="text-callout text-text-2">Nothing was logged this month.</p>
      ) : (
        <DayGroups
          groups={groupEntriesByDay(month.entries, dayKeyOfDate(new Date()))}
          buckets={month.buckets}
          readOnly
        />
      )}
    </Screen>
  );
}

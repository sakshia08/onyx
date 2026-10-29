import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { Screen } from "@/app/Screen";
import { BucketVial } from "@/components/BucketVial";
import { EyeButton } from "@/components/EyeButton";
import { MonthTank } from "@/components/MonthTank";
import { SectionHeader } from "@/components/SectionHeader";
import { recentEntries } from "@/domain/activity";
import { bucketUsed } from "@/domain/budget";
import { dayInMonth, dayKeyOfDate, daysInMonth, daysLeft, monthName } from "@/domain/dates";
import { greeting } from "@/domain/greeting";
import { bucketsForHome } from "@/domain/setup";
import { monthRemaining, monthUsed } from "@/domain/totals";
import type { Bucket, Month } from "@/domain/types";
import { useActiveMonth, useNow } from "@/store/hooks";
import { useAppStore } from "@/store";
import { BucketEntryRow } from "../entries/EntryList";
import { useQuickAdd } from "../quick-add/quick-add-context";
import { BudgetSheet } from "./BudgetSheet";
import { QuickLogRow } from "./QuickLogRow";
import { PiggyPeekSection } from "./PiggyPeekSection";
import { ComingUp, DueNow } from "./RecurringSections";
import { RecentEmpty } from "./RecentEmpty";

/** Home (PRD §8.3): greeting, the month tank, bucket vials and recent entries. */
export function HomeScreen() {
  const month = useActiveMonth();
  const now = useNow();
  const name = useAppStore((s) => s.data.profile.name);
  const piggies = useAppStore((s) => s.data.piggies);
  const [budgetOpen, setBudgetOpen] = useState(false);
  if (month === null) return null;

  const today = dayInMonth(month.key, now);
  const days = daysInMonth(month.key);
  const { spend, save } = bucketsForHome(month.buckets);
  const recent = recentEntries(month.entries);

  return (
    <Screen>
      <header className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-callout text-text-2">{greeting(now.getHours(), name)}</p>
          <h1 className="text-title text-text-1">{monthName(month.key)}</h1>
        </div>
        <EyeButton />
      </header>

      <MonthTank
        className="mt-5"
        remaining={monthRemaining(month, piggies)}
        totalBudget={month.totalBudget}
        used={monthUsed(month, piggies)}
        daysLeft={daysLeft(today, days)}
        onEditBudget={() => {
          setBudgetOpen(true);
        }}
      />
      <BudgetSheet month={month} open={budgetOpen} onOpenChange={setBudgetOpen} />

      <DueNow month={month} today={today} />

      <QuickLogRow month={month} />

      <VialGroup title="Spend" buckets={spend} month={month} today={today} days={days} />
      <VialGroup title="Save" buckets={save} month={month} today={today} days={days} />

      <ComingUp month={month} today={today} />

      <PiggyPeekSection today={dayKeyOfDate(now)} />

      <SectionHeader
        title="Recent"
        className="mt-section"
        {...(recent.length > 0
          ? {
              trailing: (
                <Link
                  to="/activity"
                  className="-my-3 inline-flex items-center py-3 text-callout text-text-2"
                >
                  See all
                </Link>
              ),
            }
          : {})}
      />
      {recent.length === 0 ? (
        <RecentEmpty />
      ) : (
        <div className="-mx-2">
          {recent.map((e) => (
            <BucketEntryRow
              key={e.id}
              entry={e}
              bucket={month.buckets.find((b) => b.id === e.bucketId)}
            />
          ))}
        </div>
      )}
    </Screen>
  );
}

function VialGroup({
  title,
  buckets,
  month,
  today,
  days,
}: {
  title: string;
  buckets: Bucket[];
  month: Month;
  today: number;
  days: number;
}) {
  const navigate = useNavigate();
  const quickAdd = useQuickAdd();
  if (buckets.length === 0) return null;
  return (
    <section aria-label={`${title} buckets`}>
      <SectionHeader title={title} className="mt-section" />
      <div className="grid grid-cols-3 gap-3">
        {buckets.map((b) => (
          <BucketVial
            key={b.id}
            name={b.name}
            emoji={b.emoji}
            color={b.color}
            kind={b.kind}
            allocated={b.allocated}
            used={bucketUsed(month.entries, b.id)}
            today={today}
            daysInMonth={days}
            onClick={() => {
              void navigate(`/bucket/${b.id}`);
            }}
            onLongPress={() => {
              quickAdd.openAdd(b.id);
            }}
          />
        ))}
      </div>
    </section>
  );
}

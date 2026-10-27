import { useNavigate } from "react-router";
import { Screen } from "@/app/Screen";
import { BucketVial } from "@/components/BucketVial";
import { MonthTank } from "@/components/MonthTank";
import { SectionHeader } from "@/components/SectionHeader";
import { recentEntries } from "@/domain/activity";
import { bucketUsed } from "@/domain/budget";
import { dayInMonth, daysInMonth, daysLeft, monthName } from "@/domain/dates";
import { greeting } from "@/domain/greeting";
import { bucketsForHome } from "@/domain/setup";
import { monthRemaining, monthUsed } from "@/domain/totals";
import type { Bucket, Month } from "@/domain/types";
import { useActiveMonth, useNow } from "@/store/hooks";
import { useAppStore } from "@/store";
import { BucketEntryRow } from "../entries/EntryList";
import { RecentEmpty } from "./RecentEmpty";

/** Home (PRD §8.3): greeting, the month tank, bucket vials and recent entries. */
export function HomeScreen() {
  const month = useActiveMonth();
  const now = useNow();
  const name = useAppStore((s) => s.data.profile.name);
  const piggies = useAppStore((s) => s.data.piggies);
  if (month === null) return null;

  const today = dayInMonth(month.key, now);
  const days = daysInMonth(month.key);
  const { spend, save } = bucketsForHome(month.buckets);
  const recent = recentEntries(month.entries);

  return (
    <Screen>
      <header>
        <p className="text-callout text-text-2">{greeting(now.getHours(), name)}</p>
        <h1 className="text-title text-text-1">{monthName(month.key)}</h1>
      </header>

      <MonthTank
        className="mt-5"
        remaining={monthRemaining(month, piggies)}
        totalBudget={month.totalBudget}
        used={monthUsed(month, piggies)}
        daysLeft={daysLeft(today, days)}
      />

      <VialGroup title="Spend" buckets={spend} month={month} today={today} days={days} />
      <VialGroup title="Save" buckets={save} month={month} today={today} days={days} />

      <SectionHeader title="Recent" className="mt-section" />
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
          />
        ))}
      </div>
    </section>
  );
}

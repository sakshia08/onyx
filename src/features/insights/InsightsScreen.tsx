import { ArrowDown, ArrowUp, ChevronLeft, ChevronRight, Lock, Search } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router";
import { Screen } from "@/app/Screen";
import { Amount } from "@/components/Amount";
import { BarChart } from "@/components/BarChart";
import { Button } from "@/components/Button";
import { Chip } from "@/components/Chip";
import { ProgressBar } from "@/components/ProgressBar";
import { SectionHeader } from "@/components/SectionHeader";
import { SegmentedControl } from "@/components/SegmentedControl";
import { bucketTint } from "@/components/bucket-color";
import { dayInMonth, daysInMonth, monthKeyOfDate, monthName } from "@/domain/dates";
import {
  bucketTiles,
  defaultWeek,
  monthBars,
  monthsNewestFirst,
  savedThisMonth,
  weekBars,
  weekLabel,
  weekStarts,
  type BucketTile,
} from "@/domain/insights";
import { canOfferLeftover } from "@/domain/rollover";
import { monthRemaining, monthUsed } from "@/domain/totals";
import type { Month, MonthKey } from "@/domain/types";
import { useNow } from "@/store/hooks";
import { useAppStore } from "@/store";

const VIEWS = [
  { value: "week", label: "Week" },
  { value: "month", label: "Month" },
] as const;

/** Insights (PRD §8.9): pick a month, see its spending by day, its buckets and its savings. */
export function InsightsScreen() {
  const navigate = useNavigate();
  const data = useAppStore((s) => s.data);
  const months = monthsNewestFirst(data.months);
  const [key, setKey] = useState<MonthKey | null>(data.activeMonthKey);
  const month = (key === null ? undefined : data.months[key]) ?? months[0];
  const thisYear = String(new Date().getFullYear());

  return (
    <Screen>
      <header className="flex items-center justify-between">
        <h1 className="text-title text-text-1">Insights</h1>
        <button
          type="button"
          aria-label="Search entries"
          onClick={() => {
            void navigate("/search");
          }}
          className="grid size-11 place-items-center rounded-pill bg-surface-2 text-text-1"
        >
          <Search aria-hidden="true" className="size-5" />
        </button>
      </header>

      <div
        role="group"
        aria-label="Month"
        className="relative -mx-screen mt-4 flex gap-2 overflow-x-auto px-screen py-1 [scrollbar-width:none]"
      >
        {months.map((m) => (
          <Chip
            key={m.key}
            selected={m.key === month?.key}
            onClick={() => {
              setKey(m.key);
            }}
          >
            {monthName(m.key)}
            {m.key.slice(0, 4) !== thisYear && ` ${m.key.slice(0, 4)}`}
          </Chip>
        ))}
      </div>

      {month && <MonthInsights key={month.key} month={month} />}
    </Screen>
  );
}

function MonthInsights({ month }: { month: Month }) {
  const navigate = useNavigate();
  const months = useAppStore((s) => s.data.months);
  const piggies = useAppStore((s) => s.data.piggies);
  const now = useNow();
  const isCurrent = month.key === monthKeyOfDate(now) && month.status === "active";
  const today = isCurrent ? dayInMonth(month.key, now) : null;
  const closed = month.status === "closed";

  const [view, setView] = useState<"week" | "month">("week");
  const [monday, setMonday] = useState(() => defaultWeek(month.key, today));
  const weeks = weekStarts(month.key);
  const bars = view === "week" ? weekBars(month, monday) : monthBars(month);
  // Start on today, or the month's last day for a past month (never a day outside the month)
  const startDay = today ?? daysInMonth(month.key);
  const exact = bars.findIndex((b) => b.day === startDay);
  const lastInMonth = bars.reduce(
    (found, b, i) => (b.day !== null && b.day <= startDay ? i : found),
    0,
  );
  const todayIndex = exact >= 0 ? exact : lastInMonth;
  const [selected, setSelected] = useState<number | null>(null);
  const shown = selected ?? Math.max(0, todayIndex);

  const used = monthUsed(month, piggies);
  const left = monthRemaining(month, piggies);
  const saved = savedThisMonth(month, piggies);
  const weekIndex = weeks.indexOf(monday);

  return (
    <>
      <section
        aria-label="Summary"
        className="mt-5 rounded-card border border-hairline bg-surface-1 p-5"
      >
        <div className="flex items-start justify-between">
          <div>
            <p className="micro-label">Left</p>
            <Amount value={left} size="title" />
          </div>
          {closed && (
            <span className="flex items-center gap-1 rounded-pill bg-surface-2 px-2.5 py-1 text-caption text-text-2">
              <Lock aria-hidden="true" className="size-3" />
              Closed
            </span>
          )}
        </div>
        <ProgressBar
          className="mt-4"
          value={month.totalBudget > 0 ? used / month.totalBudget : 0}
          color="var(--liquid)"
          over={left < 0}
          label="Budget used"
        />
        <p className="mt-2 text-callout text-text-2">
          <Amount value={used} size="callout" tone="inherit" /> used of{" "}
          <Amount value={month.totalBudget} size="callout" tone="inherit" />
        </p>
      </section>

      <section
        aria-label="Spending"
        className="mt-section rounded-card border border-hairline bg-surface-1 p-5"
      >
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-headline text-text-1">Spending</h2>
          <SegmentedControl
            label="Chart view"
            options={VIEWS}
            value={view}
            onChange={(v) => {
              setView(v);
              setSelected(null);
            }}
            className="w-40"
          />
        </div>
        {view === "week" && (
          <div className="mt-3 flex items-center justify-between">
            <button
              type="button"
              aria-label="Previous week"
              disabled={weekIndex <= 0}
              onClick={() => {
                setMonday(weeks[weekIndex - 1] ?? monday);
                setSelected(null);
              }}
              className="grid size-11 place-items-center rounded-pill text-text-2 disabled:opacity-30"
            >
              <ChevronLeft aria-hidden="true" className="size-5" />
            </button>
            <span className="text-callout text-text-2 tabular-nums">
              {weekLabel(month.key, monday)}
            </span>
            <button
              type="button"
              aria-label="Next week"
              disabled={weekIndex >= weeks.length - 1}
              onClick={() => {
                setMonday(weeks[weekIndex + 1] ?? monday);
                setSelected(null);
              }}
              className="grid size-11 place-items-center rounded-pill text-text-2 disabled:opacity-30"
            >
              <ChevronRight aria-hidden="true" className="size-5" />
            </button>
          </div>
        )}
        <div className="mt-2">
          <BarChart
            bars={bars.map((b) => ({
              label: b.label,
              name: b.name,
              value: b.value,
              disabled: b.day === null,
            }))}
            selected={shown}
            onSelect={setSelected}
            labelEvery={view === "month" ? 5 : 1}
          />
        </div>
        <p className="mt-1 text-center text-caption text-text-3">
          {bars[shown]?.name} · spend buckets only
        </p>
      </section>

      <section aria-label="Buckets">
        <SectionHeader title="Buckets" className="mt-section" />
        <div className="grid grid-cols-2 gap-3">
          {bucketTiles(month, months).map((tile) => (
            <Tile key={tile.bucket.id} tile={tile} />
          ))}
        </div>
      </section>

      <section
        aria-label="Saved this month"
        className="mt-section rounded-card border border-hairline bg-surface-1 p-5"
      >
        <p className="micro-label">Saved this month</p>
        <Amount value={saved.total} size="title" className="mt-1" />
        <p className="mt-1 text-callout text-text-2">
          <Amount value={saved.buckets} size="callout" tone="inherit" /> in save buckets ·{" "}
          <Amount value={saved.piggies} size="callout" tone="inherit" /> into piggies
        </p>
      </section>

      <div className="mt-section flex flex-col gap-2">
        {closed && (
          <Button
            size="lg"
            className="w-full"
            onClick={() => {
              void navigate(`/recap/${month.key}`);
            }}
          >
            View recap
          </Button>
        )}
        {closed &&
          canOfferLeftover(month, piggies) &&
          piggies.some((p) => p.status === "active") && (
            <Button
              variant="piggy"
              size="lg"
              className="w-full"
              onClick={() => {
                void navigate(`/leftover/${month.key}`);
              }}
            >
              Move leftover to a piggy
            </Button>
          )}
        <Button
          variant="secondary"
          size="lg"
          className="w-full"
          onClick={() => {
            void navigate(closed ? `/month/${month.key}` : "/activity");
          }}
        >
          See all entries
        </Button>
      </div>
    </>
  );
}

function Tile({ tile }: { tile: BucketTile }) {
  const { bucket, used, change } = tile;
  return (
    <div className="flex flex-col rounded-card border border-hairline bg-surface-1 p-4">
      <div className="flex items-center justify-between">
        <span
          aria-hidden="true"
          className="grid size-9 place-items-center rounded-inner text-[18px]"
          style={{ backgroundColor: bucketTint(bucket.color) }}
        >
          {bucket.emoji}
        </span>
        <Change change={change} />
      </div>
      <span className="mt-3 truncate text-callout text-text-2">{bucket.name}</span>
      <Amount value={used} size="headline" />
      <span className="text-caption text-text-3">
        {bucket.kind === "save" ? "put away" : "used"}
      </span>
    </div>
  );
}

function Change({ change }: { change: number | "new" | null }) {
  if (change === null) return null;
  if (change === "new") {
    return (
      <span className="rounded-pill bg-surface-2 px-2 py-0.5 text-caption text-text-2">New</span>
    );
  }
  const Icon = change > 0 ? ArrowUp : ArrowDown;
  return (
    <span
      className="flex items-center gap-0.5 rounded-pill bg-surface-2 px-2 py-0.5 text-caption text-text-2 tabular-nums"
      aria-label={
        change === 0
          ? "Same as last month"
          : `${change > 0 ? "Up" : "Down"} ${String(Math.abs(change))}% from last month`
      }
    >
      {change !== 0 && <Icon aria-hidden="true" className="size-3" />}
      {Math.abs(change)}%
    </span>
  );
}

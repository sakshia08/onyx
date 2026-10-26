import { Eye } from "lucide-react";
import { useState } from "react";
import { Screen } from "@/app/Screen";
import { BucketVial } from "@/components/BucketVial";
import { EntryRow } from "@/components/EntryRow";
import { MonthTank } from "@/components/MonthTank";
import { PiggyPeek } from "@/components/PiggyPeek";
import { QuickLogChip } from "@/components/QuickLogChip";
import { SectionHeader } from "@/components/SectionHeader";
import { TabBar } from "@/components/TabBar";
import {
  SAMPLE_BUCKETS,
  SAMPLE_DAY,
  SAMPLE_DAYS,
  SAMPLE_FAVORITES,
  SAMPLE_MONTH,
  SAMPLE_PIGGY,
} from "./sample-data";
import { QuickAddSheetDemo } from "./sections/QuickAddSheetDemo";

/** Dev-only page at /#/design/home: the Home building blocks put together with sample data. */
export function HomeMockup() {
  const [sheetOpen, setSheetOpen] = useState(false);
  const spend = SAMPLE_BUCKETS.filter((b) => b.kind === "spend");
  const save = SAMPLE_BUCKETS.filter((b) => b.kind === "save");

  return (
    <>
      <Screen>
        <header className="flex items-center justify-between">
          <div>
            <p className="text-callout text-text-2">Good evening</p>
            <h1 className="text-title text-text-1">{SAMPLE_MONTH.name}</h1>
          </div>
          <button
            type="button"
            aria-label="Hide amounts"
            className="grid size-11 place-items-center rounded-pill bg-surface-2 text-text-2"
          >
            <Eye aria-hidden="true" className="size-5" />
          </button>
        </header>

        <MonthTank
          className="mt-5"
          remaining={SAMPLE_MONTH.budget - SAMPLE_MONTH.used}
          totalBudget={SAMPLE_MONTH.budget}
          used={SAMPLE_MONTH.used}
          daysLeft={SAMPLE_MONTH.daysLeft}
        />

        <div className="relative -mx-screen mt-4 flex gap-2 overflow-x-auto px-screen pb-1">
          {SAMPLE_FAVORITES.map((f) => (
            <QuickLogChip key={f.label} {...f} />
          ))}
        </div>

        <SectionHeader title="Spend" className="mt-section" />
        <div className="grid grid-cols-3 gap-3">
          {spend.map((b) => (
            <BucketVial key={b.name} {...b} {...SAMPLE_DAY} />
          ))}
        </div>
        <SectionHeader title="Save" className="mt-section" />
        <div className="grid grid-cols-3 gap-3">
          {save.map((b) => (
            <BucketVial key={b.name} {...b} {...SAMPLE_DAY} />
          ))}
        </div>

        <SectionHeader title="Piggy" className="mt-section" />
        <PiggyPeek {...SAMPLE_PIGGY} />

        <SectionHeader title="Recent" trailing="See all" className="mt-section" />
        <div className="-mx-2">
          {SAMPLE_DAYS[0]?.entries.map((e) => (
            <EntryRow key={e.title} {...e} />
          ))}
        </div>
      </Screen>
      <TabBar
        onAdd={() => {
          setSheetOpen(true);
        }}
      />
      <QuickAddSheetDemo open={sheetOpen} onOpenChange={setSheetOpen} />
    </>
  );
}

import { useState } from "react";
import { Link } from "react-router";
import { BucketVial } from "@/components/BucketVial";
import { Button } from "@/components/Button";
import { MonthTank } from "@/components/MonthTank";
import { PiggyPeek } from "@/components/PiggyPeek";
import { QuickLogChip } from "@/components/QuickLogChip";
import { SectionHeader } from "@/components/SectionHeader";
import { rupees } from "@/domain/money";
import {
  SAMPLE_BUCKETS,
  SAMPLE_DAY,
  SAMPLE_FAVORITES,
  SAMPLE_MONTH,
  SAMPLE_PIGGY,
} from "../sample-data";
import { PreviewSection } from "../PreviewSection";

const OVER_BUDGET_USED = rupees(62_350);
const STEP = rupees(500);

/** The Home building blocks, with buttons that move the liquid so the motion can be judged. */
export function HomeSection() {
  const [monthUsed, setMonthUsed] = useState<number>(SAMPLE_MONTH.used);
  const [extraUsed, setExtraUsed] = useState<Record<string, number>>({});
  const buckets = SAMPLE_BUCKETS.map((b) => ({ ...b, used: b.used + (extraUsed[b.name] ?? 0) }));
  const spend = buckets.filter((b) => b.kind === "spend");
  const save = buckets.filter((b) => b.kind === "save");

  const addTo = (name: string) => {
    setExtraUsed((prev) => ({ ...prev, [name]: (prev[name] ?? 0) + STEP }));
  };

  return (
    <PreviewSection
      id="home"
      title="Home"
      note="The month is a tank that drains as you spend. Spend buckets drain, save buckets fill up. The notch on a vial's edge is today's pace."
    >
      <MonthTank
        remaining={SAMPLE_MONTH.budget - monthUsed}
        totalBudget={SAMPLE_MONTH.budget}
        used={monthUsed}
        daysLeft={SAMPLE_MONTH.daysLeft}
      />
      <div className="mt-3 flex flex-wrap gap-2">
        <Button
          variant="secondary"
          onClick={() => {
            setMonthUsed((u) => Math.min(u + rupees(6_000), OVER_BUDGET_USED));
          }}
        >
          Spend ₹6,000
        </Button>
        <Button
          variant="secondary"
          onClick={() => {
            setMonthUsed(OVER_BUDGET_USED);
          }}
        >
          Over budget
        </Button>
        <Button
          variant="ghost"
          onClick={() => {
            setMonthUsed(SAMPLE_MONTH.used);
          }}
        >
          Reset
        </Button>
      </div>

      <div className="relative -mx-screen mt-5 flex gap-2 overflow-x-auto px-screen pb-1">
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
      <div className="mt-3 flex flex-wrap gap-2">
        <Button
          variant="secondary"
          onClick={() => {
            addTo("Food");
          }}
        >
          Spend ₹500 on Food
        </Button>
        <Button
          variant="secondary"
          onClick={() => {
            addTo("Investing");
          }}
        >
          Put ₹500 in Investing
        </Button>
        <Button
          variant="ghost"
          onClick={() => {
            setExtraUsed({});
          }}
        >
          Reset
        </Button>
      </div>
      <p className="mt-2 text-caption text-text-3">
        Food on pace · Commute ahead of pace (amber dot) · Leisure over · ₹0 bucket · Investing left
        to put away · Saving extra put away.
      </p>

      <SectionHeader title="Piggy" className="mt-section" />
      <PiggyPeek {...SAMPLE_PIGGY} />

      <Link
        to="/design/home"
        className="mt-5 inline-flex min-h-11 items-center text-callout font-semibold text-accent"
      >
        See it all together as a Home screen →
      </Link>
    </PreviewSection>
  );
}

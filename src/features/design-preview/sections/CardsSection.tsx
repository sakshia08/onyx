import { useState } from "react";
import { BucketCard } from "@/components/BucketCard";
import { Card } from "@/components/Card";
import { Chip } from "@/components/Chip";
import { HeroCard } from "@/components/HeroCard";
import { SectionHeader } from "@/components/SectionHeader";
import { rupees } from "@/domain/money";
import { SAMPLE_BUCKETS, SAMPLE_DAY } from "../sample-data";
import { PreviewSection } from "../PreviewSection";

export function CardsSection() {
  const [overBudget, setOverBudget] = useState(false);
  const used = overBudget ? rupees(62_350) : rupees(26_550);

  return (
    <PreviewSection id="cards" title="Cards">
      <HeroCard
        remaining={rupees(60_000) - used}
        totalBudget={rupees(60_000)}
        used={used}
        daysLeft={13}
      />
      <div className="mt-3 flex gap-2">
        <Chip
          selected={!overBudget}
          onClick={() => {
            setOverBudget(false);
          }}
        >
          Normal
        </Chip>
        <Chip
          selected={overBudget}
          onClick={() => {
            setOverBudget(true);
          }}
        >
          Over budget
        </Chip>
      </div>

      <SectionHeader title="Buckets" className="mt-section" />
      <div className="grid grid-cols-2 gap-3">
        {SAMPLE_BUCKETS.map((b) => (
          <BucketCard key={b.name} {...b} {...SAMPLE_DAY} />
        ))}
      </div>
      <p className="mt-2 text-caption text-text-3">
        Food on pace · Commute ahead of pace (amber dot) · Leisure over · ₹0 bucket · Investing left
        to put away · Saving extra put away.
      </p>

      <SectionHeader title="Plain card" className="mt-section" />
      <Card>
        <p className="text-headline text-text-1">Calm, layered surfaces</p>
        <p className="mt-1 text-callout text-text-2">
          Depth comes from surfaces and hairlines, not heavy shadows.
        </p>
      </Card>
    </PreviewSection>
  );
}

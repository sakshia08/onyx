import { Eye, Search } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/Button";
import { Chip } from "@/components/Chip";
import { PigIcon } from "@/components/PigIcon";
import { SegmentedControl } from "@/components/SegmentedControl";
import { SAMPLE_BUCKETS } from "../sample-data";
import { PreviewSection } from "../PreviewSection";

const TYPES = [
  { value: "expense", label: "Expense" },
  { value: "refund", label: "Money back" },
] as const;

export function ControlsSection() {
  const [selected, setSelected] = useState("Food");
  const [type, setType] = useState<(typeof TYPES)[number]["value"]>("expense");

  return (
    <PreviewSection id="controls" title="Buttons, chips and controls">
      <div className="flex flex-col gap-3">
        <Button size="lg" className="w-full">
          Start November
        </Button>
        <Button size="lg" variant="piggy" className="w-full">
          <PigIcon className="size-5" strokeWidth={2.2} />
          Stash ₹4,000
        </Button>
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary">Same as last month</Button>
          <Button variant="ghost">Skip</Button>
          <Button variant="destructive">Delete</Button>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="icon" aria-label="Hide amounts">
            <Eye aria-hidden="true" className="size-5" />
          </Button>
          <Button variant="secondary" size="icon" aria-label="Search">
            <Search aria-hidden="true" className="size-5" />
          </Button>
          <Button disabled>Disabled</Button>
        </div>
      </div>

      <h3 className="mt-5 mb-2 text-caption text-text-2">Chips</h3>
      <div className="-mx-screen flex gap-2 overflow-x-auto px-screen py-1 [scrollbar-width:none]">
        {SAMPLE_BUCKETS.map((b) => (
          <Chip
            key={b.name}
            color={b.color}
            leading={b.emoji}
            selected={selected === b.name}
            onClick={() => {
              setSelected(b.name);
            }}
          >
            {b.name}
          </Chip>
        ))}
        <Chip leading={<PigIcon className="size-4 text-piggy-strong" strokeWidth={2.2} />}>
          Goa trip
        </Chip>
      </div>
      <div className="mt-2 flex flex-wrap gap-2">
        <Chip selected>Today</Chip>
        <Chip>Same as October · ₹60,000</Chip>
      </div>

      <h3 className="mt-5 mb-2 text-caption text-text-2">Segmented control</h3>
      <SegmentedControl label="Entry type" options={TYPES} value={type} onChange={setType} />
    </PreviewSection>
  );
}

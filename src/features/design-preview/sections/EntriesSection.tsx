import { Amount } from "@/components/Amount";
import { EntryRow } from "@/components/EntryRow";
import { SAMPLE_DAYS } from "../sample-data";
import { PreviewSection } from "../PreviewSection";

export function EntriesSection() {
  return (
    <PreviewSection id="entries" title="Entry rows">
      <div className="flex flex-col gap-5">
        {SAMPLE_DAYS.map((day) => (
          <div key={day.label}>
            <div className="mb-1 flex items-baseline justify-between px-2">
              <h3 className="micro-label">{day.label}</h3>
              <Amount value={-day.total} size="caption" tone="default" className="text-text-3" />
            </div>
            <div className="rounded-card border border-hairline bg-surface-1 p-2">
              {day.entries.map((entry) => (
                <EntryRow key={entry.title} {...entry} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </PreviewSection>
  );
}

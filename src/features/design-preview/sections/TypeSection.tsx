import { Amount } from "@/components/Amount";
import { rupees } from "@/domain/money";
import { PreviewSection } from "../PreviewSection";

const STYLES = [
  {
    name: "Display",
    spec: "48/52 · Semibold · −0.03em",
    className: "text-display",
    sample: "₹33,450",
  },
  { name: "Title", spec: "28/34 · Semibold", className: "text-title", sample: "November" },
  {
    name: "Headline",
    spec: "17/22 · Semibold",
    className: "text-headline",
    sample: "Recent activity",
  },
  {
    name: "Body",
    spec: "16/22 · Regular",
    className: "text-body",
    sample: "Dosa and filter coffee",
  },
  {
    name: "Callout",
    spec: "15/20 · Regular",
    className: "text-callout",
    sample: "of ₹60,000 · ₹26,550 used",
  },
  { name: "Caption", spec: "13/18 · Medium", className: "text-caption", sample: "13:42 · Food" },
  {
    name: "Micro label",
    spec: "11/14 · Semibold · +0.08em",
    className: "micro-label !text-text-1",
    sample: "Left this month",
  },
] as const;

export function TypeSection() {
  return (
    <PreviewSection
      id="type"
      title="Type scale"
      note="SF Pro on iPhone, bundled Inter on other devices."
    >
      <div className="flex flex-col divide-y divide-hairline rounded-card border border-hairline bg-surface-1 px-5">
        {STYLES.map((s) => (
          <div key={s.name} className="py-3.5">
            <div className="flex items-baseline justify-between gap-3">
              <span className="text-caption text-text-2">{s.name}</span>
              <span className="text-micro font-medium tracking-normal text-text-3">{s.spec}</span>
            </div>
            <p className={`${s.className} mt-1 truncate text-text-1`}>{s.sample}</p>
          </div>
        ))}
      </div>

      <h3 className="mt-5 mb-2 text-caption text-text-2">Amounts</h3>
      <div className="flex flex-col gap-4 rounded-card border border-hairline bg-surface-1 p-5">
        <Row label="Whole rupees">
          <Amount value={rupees(1_00_000)} size="title" />
        </Row>
        <Row label="With paise">
          <Amount value={rupees(1240) + 50} size="title" />
        </Row>
        <Row label="Negative balance">
          <Amount value={-rupees(500)} size="title" />
        </Row>
        <Row label="Money back">
          <Amount value={rupees(400)} size="title" tone="positive" signDisplay="always" />
        </Row>
        <Row label="Piggy (rounded)">
          <Amount value={rupees(18_600)} size="title" rounded />
        </Row>
      </div>
    </PreviewSection>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <span className="text-caption text-text-2">{label}</span>
      {children}
    </div>
  );
}

import { useNavigate } from "react-router";
import { Chip } from "@/components/Chip";
import { PigIllustration } from "@/components/PigIllustration";
import { PIGGY_TEMPLATES } from "@/domain/piggy-actions";

/** No active piggies: a sleeping pig, and templates to start one (PRD §8.6). */
export function PiggyEmpty({ hasCompleted }: { hasCompleted: boolean }) {
  const navigate = useNavigate();
  return (
    <section aria-label="No piggies yet" className="mt-8 flex flex-col items-center text-center">
      <PigIllustration progress={0} sleeping width={220} />
      <h2 className="mt-6 text-headline text-text-1">
        {hasCompleted ? "All your piggies are done" : "Save up for something"}
      </h2>
      <p className="mt-1 max-w-[300px] text-callout text-text-2">
        A piggy holds money across months for one plan: a trip, a phone, Diwali.
      </p>
      <div className="mt-6 flex flex-wrap justify-center gap-2">
        {PIGGY_TEMPLATES.map((t, i) => (
          <Chip
            key={t.name}
            leading={t.emoji}
            onClick={() => {
              void navigate(`/piggy/new?template=${String(i)}`);
            }}
          >
            {t.name}
          </Chip>
        ))}
      </div>
    </section>
  );
}

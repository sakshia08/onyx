import { useNavigate } from "react-router";
import { PiggyPeek } from "@/components/PiggyPeek";
import { SectionHeader } from "@/components/SectionHeader";
import { piggyBalance } from "@/domain/piggy";
import { daysToGo, nearestPiggy } from "@/domain/piggy-actions";
import type { DayKey } from "@/domain/types";
import { useAppStore } from "@/store";

/** Home's piggy peek (PRD §8.3): the active piggy with the nearest date. Opens the Piggy tab. */
export function PiggyPeekSection({ today }: { today: DayKey }) {
  const navigate = useNavigate();
  const piggies = useAppStore((s) => s.data.piggies);
  const piggy = nearestPiggy(piggies, today);
  if (piggy === null) return null;
  return (
    <section aria-label="Piggy">
      <SectionHeader title="Piggy" className="mt-section" />
      <PiggyPeek
        name={piggy.name}
        emoji={piggy.emoji}
        saved={piggyBalance(piggy)}
        target={piggy.target}
        daysLeft={daysToGo(piggy, today)}
        onClick={() => {
          void navigate("/piggy");
        }}
      />
    </section>
  );
}

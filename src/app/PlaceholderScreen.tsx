import { Link } from "react-router";
import { Card } from "@/components/Card";
import { Screen } from "./Screen";

interface PlaceholderScreenProps {
  title: string;
  phase: number;
  glow?: "liquid" | "piggy";
}

/** Stand-in for screens that later phases build. */
export function PlaceholderScreen({ title, phase, glow = "liquid" }: PlaceholderScreenProps) {
  return (
    <Screen glow={glow}>
      <h1 className="pt-2 text-title text-text-1">{title}</h1>
      <Card className="mt-section">
        <p className="text-callout text-text-2">This screen arrives in Phase {phase}.</p>
        {import.meta.env.DEV && (
          <Link
            to="/design"
            className="mt-3 inline-flex min-h-11 items-center text-callout font-semibold text-accent"
          >
            Open the design preview
          </Link>
        )}
      </Card>
    </Screen>
  );
}

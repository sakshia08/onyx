import { cn } from "@/lib/cn";

/** "Step 1 of 2" as two small dots. */
export function StepDots({ step }: { step: 1 | 2 }) {
  return (
    <span role="img" aria-label={`Step ${String(step)} of 2`} className="flex gap-1.5">
      {[1, 2].map((n) => (
        <span
          key={n}
          className={cn(
            "h-1.5 rounded-pill transition-all",
            n === step ? "w-5 bg-text-1" : "w-1.5 bg-text-3/60",
          )}
        />
      ))}
    </span>
  );
}

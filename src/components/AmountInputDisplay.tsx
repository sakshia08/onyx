import { evaluate, formatExpression } from "@/domain/expression";
import { cn } from "@/lib/cn";
import { Amount } from "./Amount";

interface AmountInputDisplayProps {
  input: string;
  className?: string;
}

/** The big amount above the keypad: "250 + 180" small, "₹430" large (PRD §8.4). */
export function AmountInputDisplay({ input, className }: AmountInputDisplayProps) {
  const result = evaluate(input);
  const showExpression = result.ok && result.hasOperator;
  return (
    <div className={cn("flex flex-col items-center", className)} aria-live="polite">
      <span className={cn("h-[18px] text-caption text-text-3", !showExpression && "invisible")}>
        {formatExpression(input)}
      </span>
      {result.ok ? (
        <Amount value={result.value} size="display" className="mt-1" />
      ) : (
        <span className="mt-1 inline-flex items-baseline text-display text-text-3">
          <span className="mr-[0.06em] text-[0.55em] font-medium">₹</span>
          <span>{input === "" ? "0" : formatExpression(input)}</span>
          <span
            aria-hidden="true"
            className="caret ml-1 h-[0.8em] w-0.5 self-center rounded-pill bg-accent-b"
          />
        </span>
      )}
    </div>
  );
}

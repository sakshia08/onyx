import { animate, useReducedMotion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { amountParts, spokenAmount, type Paise, type SignDisplay } from "@/domain/money";
import { cn } from "@/lib/cn";

type AmountSize = "display" | "title" | "headline" | "body" | "callout" | "caption";
type AmountTone = "auto" | "default" | "positive" | "negative" | "inherit";

const sizeClass: Record<AmountSize, string> = {
  display: "text-display",
  title: "text-title",
  headline: "text-headline",
  body: "text-body font-medium",
  callout: "text-callout font-medium",
  caption: "text-caption",
};

const toneClass: Record<Exclude<AmountTone, "auto">, string> = {
  default: "text-text-1",
  positive: "text-positive",
  negative: "text-negative",
  inherit: "",
};

interface AmountProps {
  value: Paise;
  size?: AmountSize;
  /** "auto" turns negative values red (PRD §10.2: red is only for negative balances). */
  tone?: AmountTone;
  signDisplay?: SignDisplay;
  /** Rounded figures for piggy amounts (PRD §10.3). */
  rounded?: boolean;
  /** Count smoothly to new values (PRD §10.7). */
  animated?: boolean;
  /** Override what VoiceOver reads, e.g. "Over by 500 rupees". */
  label?: string;
  className?: string;
}

export function Amount({
  value,
  size = "body",
  tone = "auto",
  signDisplay = "auto",
  rounded = false,
  animated = false,
  label,
  className,
}: AmountProps) {
  const shown = useCountingValue(value, animated);
  const parts = amountParts(shown, signDisplay);
  const resolvedTone = tone === "auto" ? (value < 0 ? "negative" : "default") : tone;
  // On colored or inherited text, dim the ₹ and paise with opacity instead of gray
  const colored = resolvedTone !== "default";

  return (
    <span
      className={cn(
        "inline-flex items-baseline whitespace-nowrap tabular-nums",
        sizeClass[size],
        toneClass[resolvedTone],
        rounded && "font-round",
        className,
      )}
    >
      <span className="sr-only">{label ?? spokenAmount(value)}</span>
      <span aria-hidden="true" className="inline-flex items-baseline">
        {parts.sign !== "" && <span className="mr-[0.04em]">{parts.sign}</span>}
        <span
          className={cn(
            "mr-[0.06em] text-[0.55em] font-medium",
            colored ? "opacity-75" : "text-text-2",
          )}
        >
          ₹
        </span>
        <span>{parts.rupees}</span>
        {parts.paise !== null && (
          <span className={cn("text-[0.6em]", colored ? "opacity-60" : "text-text-3")}>
            .{parts.paise}
          </span>
        )}
      </span>
    </span>
  );
}

/** Animates from the previous value to the new one, always landing on whole paise. */
function useCountingValue(target: Paise, enabled: boolean): Paise {
  const reduceMotion = useReducedMotion() ?? false;
  const [shown, setShown] = useState(target);
  const from = useRef(target);

  useEffect(() => {
    if (!enabled || reduceMotion) {
      // Not animating: the hook returns `target` directly, so only remember it.
      from.current = target;
      return;
    }
    const controls = animate(from.current, target, {
      duration: 0.6,
      ease: [0.22, 1, 0.36, 1],
      onUpdate: (v) => {
        setShown(Math.round(v));
      },
    });
    from.current = target;
    return () => {
      controls.stop();
    };
  }, [target, enabled, reduceMotion]);

  return enabled && !reduceMotion ? shown : target;
}

import { useReduceMotion } from "@/lib/reduce-motion";
import { animate } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { amountParts, spokenAmount, type Paise, type SignDisplay } from "@/domain/money";
import { cn } from "@/lib/cn";
import { usePrivacy } from "@/store/privacy";

type AmountSize = "hero" | "display" | "title" | "headline" | "body" | "callout" | "caption";
type AmountTone = "auto" | "default" | "positive" | "negative" | "inherit";

const sizeClass: Record<AmountSize, string> = {
  hero: "text-hero",
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
  /** Always show the figure, even with amounts hidden (the keypad's own display). */
  reveal?: boolean;
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
  reveal = false,
  className,
}: AmountProps) {
  const shown = useCountingValue(value, animated);
  const hidden = usePrivacy((p) => p.amountsHidden) && !reveal;
  const parts = amountParts(shown, signDisplay);
  const resolvedTone = tone === "auto" ? (value < 0 ? "negative" : "default") : tone;
  // On colored or inherited text, dim the ₹ and paise with opacity instead of gray
  const colored = resolvedTone !== "default";

  if (hidden) {
    // The eye is on (PRD §8.10): "₹ ••••" everywhere, and VoiceOver says so
    return (
      <span
        className={cn(
          "inline-flex items-baseline whitespace-nowrap",
          sizeClass[size],
          "text-text-2",
          className,
        )}
      >
        <span className="sr-only">Amount hidden</span>
        <span aria-hidden="true">
          <span className="mr-[0.06em] text-[0.55em] font-medium">₹</span>
          <span className="text-[0.6em] tracking-[0.12em]">••••</span>
        </span>
      </span>
    );
  }

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
  const reduceMotion = useReduceMotion();
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

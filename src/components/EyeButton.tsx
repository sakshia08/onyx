import { Eye, EyeOff } from "lucide-react";
import { toggleAmountsHidden, usePrivacy } from "@/store/privacy";

/** Hides every amount as "₹ ••••" until tapped again (PRD §8.10). */
export function EyeButton() {
  const hidden = usePrivacy((p) => p.amountsHidden);
  const Icon = hidden ? EyeOff : Eye;
  return (
    <button
      type="button"
      aria-label={hidden ? "Show amounts" : "Hide amounts"}
      aria-pressed={hidden}
      onClick={toggleAmountsHidden}
      className="grid size-11 shrink-0 place-items-center rounded-pill bg-surface-2 text-text-2"
    >
      <Icon aria-hidden="true" className="size-5" />
    </button>
  );
}

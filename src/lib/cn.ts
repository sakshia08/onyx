import { clsx, type ClassValue } from "clsx";
import { extendTailwindMerge } from "tailwind-merge";

// Teach tailwind-merge our token names (tokens.css), so it knows "text-display" is a size
// and "text-text-1" is a color and keeps both, instead of treating them as a conflict.
const twMerge = extendTailwindMerge({
  extend: {
    theme: {
      text: ["hero", "display", "title", "headline", "body", "callout", "caption", "micro"],
      color: [
        "bg",
        "surface-1",
        "surface-2",
        "surface-3",
        "hairline",
        "hairline-strong",
        "text-1",
        "text-2",
        "text-3",
        "liquid",
        "accent",
        "piggy",
        "piggy-strong",
        "positive",
        "warning",
        "negative",
        "glass",
      ],
      radius: ["tank", "vial", "card", "inner", "pill"],
      font: ["ui", "round"],
    },
  },
});

/** Joins class names and lets later Tailwind classes override earlier ones. */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

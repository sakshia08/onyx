import type { Transition } from "motion/react";

/** PRD §10.7: springs for sheets and layout changes. */
export const spring: Transition = { type: "spring", stiffness: 400, damping: 36 };
/** A softer spring for progress bars and the pig's fill. */
export const fillSpring: Transition = { type: "spring", stiffness: 120, damping: 20 };
/** PRD §10.7: 150–250 ms fades. */
export const fade: Transition = { duration: 0.2, ease: [0.22, 1, 0.36, 1] };
/** PRD §10.7: tapping scales elements to 0.97. */
export const tapScale = { scale: 0.97 };
/** PRD §10.7: cards stagger in 30 ms apart. */
export const STAGGER_SECONDS = 0.03;

import confetti from "canvas-confetti";

/** Confetti for a goal reached (PRD §8.6). Skipped when Reduce Motion is on (PRD §10.7). */
export function celebrate(reduceMotion: boolean): void {
  if (reduceMotion || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const colors = ["#ff8fb8", "#ff5fa2", "#ffc25b", "#f5f5f7", "#7c6cff"];
  const fire = (originX: number, angle: number) =>
    void confetti({
      particleCount: 70,
      spread: 70,
      startVelocity: 48,
      angle,
      origin: { x: originX, y: 0.7 },
      colors,
      disableForReducedMotion: true,
    });
  fire(0.15, 60);
  fire(0.85, 120);
}

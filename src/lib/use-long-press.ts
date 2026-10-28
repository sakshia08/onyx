import { useRef } from "react";

const HOLD_MS = 450;
const MOVE_TOLERANCE = 10;

/**
 * Press and hold (PRD §8.3: long-press a bucket to open Quick add for it).
 * Returns pointer handlers plus `wasLongPress()`, so the click that follows can be skipped.
 */
export function useLongPress(onLongPress: (() => void) | undefined) {
  const timer = useRef<number | null>(null);
  const start = useRef<{ x: number; y: number } | null>(null);
  const fired = useRef(false);

  const cancel = () => {
    if (timer.current !== null) window.clearTimeout(timer.current);
    timer.current = null;
    start.current = null;
  };

  return {
    handlers:
      onLongPress === undefined
        ? {}
        : {
            onPointerDown: (e: React.PointerEvent) => {
              fired.current = false;
              start.current = { x: e.clientX, y: e.clientY };
              timer.current = window.setTimeout(() => {
                fired.current = true;
                timer.current = null;
                onLongPress();
              }, HOLD_MS);
            },
            onPointerMove: (e: React.PointerEvent) => {
              const s = start.current;
              if (s && Math.hypot(e.clientX - s.x, e.clientY - s.y) > MOVE_TOLERANCE) cancel();
            },
            onPointerUp: cancel,
            onPointerLeave: cancel,
            onPointerCancel: cancel,
            // No iOS callout or text selection menu on hold
            onContextMenu: (e: React.MouseEvent) => {
              e.preventDefault();
            },
          },
    wasLongPress: () => {
      const was = fired.current;
      fired.current = false;
      return was;
    },
  };
}

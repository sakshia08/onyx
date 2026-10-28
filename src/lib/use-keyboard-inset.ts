import { useEffect, useState } from "react";

/**
 * How much of the screen the iOS keyboard covers, in px (PRD §10.8: use visualViewport so
 * nothing hides behind the keyboard). 0 when it's closed or the browser can't tell.
 */
export function useKeyboardInset(): { inset: number; visibleHeight: number } {
  const [state, setState] = useState({ inset: 0, visibleHeight: 0 });
  useEffect(() => {
    const viewport = window.visualViewport;
    if (!viewport) return;
    const update = () => {
      setState({
        inset: Math.max(0, Math.round(window.innerHeight - viewport.height - viewport.offsetTop)),
        visibleHeight: Math.round(viewport.height),
      });
    };
    viewport.addEventListener("resize", update);
    viewport.addEventListener("scroll", update);
    return () => {
      viewport.removeEventListener("resize", update);
      viewport.removeEventListener("scroll", update);
    };
  }, []);
  return state;
}

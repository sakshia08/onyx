import type { CSSProperties } from "react";
import { cn } from "@/lib/cn";

interface ScreenProps {
  children: React.ReactNode;
  /** The soft glow at the top: liquid violet by default, pink on the Piggy tab. */
  glow?: "liquid" | "piggy";
  className?: string;
}

/** A tab screen: top glow, safe-area padding and room for the tab bar. */
export function Screen({ children, glow = "liquid", className }: ScreenProps) {
  const glowStyle = {
    "--glow": glow === "piggy" ? "var(--piggy-strong)" : "var(--liquid)",
  } as CSSProperties;
  return (
    <>
      <div aria-hidden="true" className="screen-glow" style={glowStyle} />
      {/* Soft fade under the status bar, so scrolled content doesn't clash with the clock */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-x-0 top-0 z-20"
        style={{
          height: "calc(var(--safe-top) + 12px)",
          background: "linear-gradient(to bottom, var(--bg) 55%, transparent)",
        }}
      />
      <main
        className={cn("relative z-10 mx-auto max-w-[560px] px-screen", className)}
        style={{
          paddingTop: "calc(var(--safe-top) + 16px)",
          paddingBottom:
            "calc(max(var(--safe-bottom), 16px) + var(--tab-bar-height) + var(--section-gap))",
          paddingLeft: "max(var(--screen-pad), var(--safe-left))",
          paddingRight: "max(var(--screen-pad), var(--safe-right))",
        }}
      >
        {children}
      </main>
    </>
  );
}

import { cn } from "@/lib/cn";

interface FullScreenProps {
  children: React.ReactNode;
  /** Pinned to the bottom on glass, above the home indicator. */
  footer?: React.ReactNode;
  className?: string;
}

/** A screen without the tab bar (welcome, setup): safe areas, top glow, sticky footer. */
export function FullScreen({ children, footer, className }: FullScreenProps) {
  return (
    <>
      <div aria-hidden="true" className="screen-glow" />
      <main
        className={cn(
          "relative z-10 mx-auto flex min-h-dvh max-w-[560px] flex-col px-screen",
          className,
        )}
        style={{
          paddingTop: "calc(var(--safe-top) + 12px)",
          paddingBottom: footer
            ? "calc(max(var(--safe-bottom), 16px) + 104px)"
            : "max(var(--safe-bottom), 16px)",
        }}
      >
        {children}
      </main>
      {footer !== undefined && (
        <div
          className="glass fixed inset-x-0 bottom-0 z-30 border-x-0 border-b-0"
          style={{ paddingBottom: "max(var(--safe-bottom), 16px)" }}
        >
          <div className="mx-auto max-w-[560px] px-screen pt-3">{footer}</div>
        </div>
      )}
    </>
  );
}

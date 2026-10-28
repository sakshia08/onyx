import { AnimatePresence, motion, useDragControls, useReducedMotion } from "motion/react";
import { Dialog } from "radix-ui";
import { fade, spring } from "@/lib/motion";
import { useKeyboardInset } from "@/lib/use-keyboard-inset";
import { cn } from "@/lib/cn";

interface SheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  /** Hide the title visually but keep it for VoiceOver. */
  hideTitle?: boolean;
  children: React.ReactNode;
  className?: string;
}

const DISMISS_DISTANCE = 120;
const DISMISS_VELOCITY = 600;

/**
 * Bottom sheet (PRD §10.5). Radix Dialog handles focus and VoiceOver;
 * Motion gives the spring and drag-to-dismiss from the handle and header.
 */
export function Sheet({
  open,
  onOpenChange,
  title,
  hideTitle = false,
  children,
  className,
}: SheetProps) {
  const dragControls = useDragControls();
  const reduceMotion = useReducedMotion() ?? false;
  // Sit above the iOS keyboard while typing (PRD §10.8)
  const keyboard = useKeyboardInset();
  const hidden = reduceMotion ? { opacity: 0 } : { y: "100%" };
  const shown = reduceMotion ? { opacity: 1 } : { y: 0 };

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <AnimatePresence>
        {open && (
          <Dialog.Portal forceMount>
            <Dialog.Overlay asChild forceMount>
              <motion.div
                className="fixed inset-0 z-40 bg-bg/70"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={fade}
              />
            </Dialog.Overlay>
            <Dialog.Content asChild forceMount aria-describedby={undefined}>
              <motion.div
                className={cn(
                  "fixed inset-x-0 bottom-0 z-50 mx-auto flex max-h-[92dvh] max-w-[560px] flex-col rounded-t-card border border-b-0 border-hairline-strong bg-surface-1 pb-[max(var(--safe-bottom),16px)] outline-none",
                  className,
                )}
                // Above the keyboard, the sheet shrinks to the visible screen and scrolls
                style={
                  keyboard.inset > 0
                    ? {
                        bottom: keyboard.inset,
                        paddingBottom: 12,
                        maxHeight: keyboard.visibleHeight - 12,
                      }
                    : {}
                }
                initial={hidden}
                animate={shown}
                exit={hidden}
                transition={reduceMotion ? fade : spring}
                drag={reduceMotion ? false : "y"}
                dragControls={dragControls}
                dragListener={false}
                dragConstraints={{ top: 0, bottom: 0 }}
                dragElastic={{ top: 0, bottom: 0.7 }}
                onDragEnd={(_, info) => {
                  if (info.offset.y > DISMISS_DISTANCE || info.velocity.y > DISMISS_VELOCITY) {
                    onOpenChange(false);
                  }
                }}
              >
                <div
                  className="flex cursor-grab touch-none flex-col items-center px-screen pt-2 pb-3"
                  onPointerDown={(event) => {
                    dragControls.start(event);
                  }}
                >
                  <span aria-hidden="true" className="h-1.25 w-9 rounded-pill bg-text-3/50" />
                  <Dialog.Title
                    className={cn("mt-3 text-headline text-text-1", hideTitle && "sr-only")}
                  >
                    {title}
                  </Dialog.Title>
                </div>
                <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-screen">
                  {children}
                </div>
              </motion.div>
            </Dialog.Content>
          </Dialog.Portal>
        )}
      </AnimatePresence>
    </Dialog.Root>
  );
}

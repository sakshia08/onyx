import { Trash2 } from "lucide-react";
import { animate, motion, useMotionValue, useTransform } from "motion/react";
import { useRef, useState } from "react";
import { spring } from "@/lib/motion";

const BUTTON_WIDTH = 88;
/** Swiping past this share of the row deletes straight away, like iOS Mail. */
const FULL_SWIPE = 0.55;

interface SwipeToDeleteProps {
  /** Read by VoiceOver on the Delete button, e.g. "Starbucks". */
  label: string;
  onDelete: () => void;
  children: React.ReactNode;
}

/**
 * Swipe a row left to reveal Delete; swipe all the way to delete at once.
 * Tapping an open row closes it instead of opening it.
 */
export function SwipeToDelete({ label, onDelete, children }: SwipeToDeleteProps) {
  const x = useMotionValue(0);
  // Fully hidden until the row moves, so no red shows at the rounded edges
  const revealed = useTransform(x, [-24, -2], [1, 0]);
  const row = useRef<HTMLDivElement>(null);
  const dragged = useRef(false);
  const [open, setOpen] = useState(false);

  const settle = (to: number) => {
    void animate(x, to, spring);
    setOpen(to !== 0);
  };

  const remove = () => {
    const width = row.current?.offsetWidth ?? 400;
    void animate(x, -width, { duration: 0.18 }).then(onDelete);
  };

  return (
    <div className="relative overflow-hidden rounded-inner">
      <motion.button
        type="button"
        aria-label={`Delete ${label}`}
        aria-hidden={!open}
        tabIndex={open ? 0 : -1}
        onClick={remove}
        className="absolute inset-y-0 right-0 flex flex-col items-center justify-center gap-0.5 bg-negative text-caption font-semibold text-bg"
        style={{ width: BUTTON_WIDTH, opacity: revealed }}
      >
        <Trash2 aria-hidden="true" className="size-5" />
        Delete
      </motion.button>
      <motion.div
        ref={row}
        style={{ x }}
        drag="x"
        dragDirectionLock
        dragConstraints={{ right: 0 }}
        dragElastic={{ right: 0, left: 0.9 }}
        dragMomentum={false}
        onDragStart={() => {
          dragged.current = true;
        }}
        onDragEnd={(_, info) => {
          const width = row.current?.offsetWidth ?? 400;
          const offset = x.get();
          if (offset < -width * FULL_SWIPE) remove();
          else if (offset < -BUTTON_WIDTH / 2 || info.velocity.x < -500) settle(-BUTTON_WIDTH);
          else settle(0);
          // The click that ends a drag shouldn't open the entry
          window.setTimeout(() => {
            dragged.current = false;
          }, 0);
        }}
        onClickCapture={(e) => {
          if (dragged.current || open) {
            e.stopPropagation();
            e.preventDefault();
            if (open && !dragged.current) settle(0);
          }
        }}
        className="relative touch-pan-y bg-bg"
      >
        {children}
      </motion.div>
    </div>
  );
}

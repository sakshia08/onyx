import { Check, Delete } from "lucide-react";
import { motion } from "motion/react";
import type { KeypadKey } from "@/domain/expression";
import { cn } from "@/lib/cn";

interface KeypadProps {
  onKey: (key: KeypadKey) => void;
  onSubmit: () => void;
  canSubmit: boolean;
  className?: string;
}

type Cell =
  | { kind: "key"; key: KeypadKey; label: React.ReactNode; aria: string; tone?: "operator" }
  | { kind: "submit" };

const digit = (d: Exclude<KeypadKey, "." | "+" | "-" | "back">): Cell => ({
  kind: "key",
  key: d,
  label: d,
  aria: d,
});

// 4 columns: digits on the left, operators on the right, ✓ spanning the last two rows.
const ROWS: Cell[][] = [
  [
    digit("1"),
    digit("2"),
    digit("3"),
    { kind: "key", key: "+", label: "+", aria: "plus", tone: "operator" },
  ],
  [
    digit("4"),
    digit("5"),
    digit("6"),
    { kind: "key", key: "-", label: "−", aria: "minus", tone: "operator" },
  ],
  [digit("7"), digit("8"), digit("9"), { kind: "submit" }],
  [
    { kind: "key", key: ".", label: ".", aria: "decimal point" },
    digit("0"),
    {
      kind: "key",
      key: "back",
      label: <Delete aria-hidden="true" className="size-6" strokeWidth={1.75} />,
      aria: "delete",
    },
  ],
];

/** The custom amount keypad (PRD §8.4): 1–9, 0, ., ⌫, +, − and ✓. */
export function Keypad({ onKey, onSubmit, canSubmit, className }: KeypadProps) {
  return (
    <div className={cn("grid grid-cols-4 grid-rows-4 gap-2", className)}>
      {ROWS.flat().map((cell, index) =>
        cell.kind === "submit" ? (
          <motion.button
            key="submit"
            type="button"
            aria-label="Save"
            disabled={!canSubmit}
            onClick={onSubmit}
            whileTap={{ scale: 0.95 }}
            className="row-span-2 grid place-items-center rounded-inner bg-text-1 text-bg transition-colors disabled:bg-surface-2 disabled:text-text-3"
          >
            <Check aria-hidden="true" className="size-7" strokeWidth={2.5} />
          </motion.button>
        ) : (
          <motion.button
            key={index}
            type="button"
            aria-label={cell.aria}
            onClick={() => {
              onKey(cell.key);
            }}
            whileTap={{ scale: 0.94 }}
            transition={{ duration: 0.12 }}
            className={cn(
              "grid h-14 place-items-center rounded-inner bg-surface-2/60 text-title font-normal transition-colors active:bg-surface-3",
              cell.tone === "operator" ? "text-text-2" : "text-text-1",
            )}
          >
            {cell.label}
          </motion.button>
        ),
      )}
    </div>
  );
}

import { Delete } from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { PIN_LENGTH } from "@/domain/pin";
import { cn } from "@/lib/cn";

interface PinPadProps {
  /** Called with all 4 digits. Return false (or a promise of false) to shake and clear. */
  onComplete: (pin: string) => boolean | Promise<boolean>;
  disabled?: boolean;
}

const KEYS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "", "0", "back"] as const;

/** Four dots and a number pad, iPhone style. */
export function PinPad({ onComplete, disabled = false }: PinPadProps) {
  const [pin, setPin] = useState("");
  const [wrong, setWrong] = useState(0);

  const press = (key: (typeof KEYS)[number]) => {
    if (disabled) return;
    if (key === "back") {
      setPin((p) => p.slice(0, -1));
      return;
    }
    const next = (pin + key).slice(0, PIN_LENGTH);
    setPin(next);
    if (next.length === PIN_LENGTH) {
      void Promise.resolve(onComplete(next)).then((ok) => {
        if (!ok) setWrong((w) => w + 1);
        setPin("");
      });
    }
  };

  return (
    <div className="flex flex-col items-center gap-8">
      <motion.div
        key={wrong}
        className="flex gap-4"
        role="status"
        aria-label={`${String(pin.length)} of ${String(PIN_LENGTH)} digits entered`}
        animate={wrong > 0 ? { x: [0, -10, 10, -6, 6, 0] } : {}}
        transition={{ duration: 0.4 }}
      >
        {Array.from({ length: PIN_LENGTH }, (_, i) => (
          <span
            key={i}
            className={cn(
              "size-3.5 rounded-pill border-2 transition-colors",
              i < pin.length ? "border-text-1 bg-text-1" : "border-text-3",
            )}
          />
        ))}
      </motion.div>
      <div className="grid grid-cols-3 gap-x-6 gap-y-4">
        {KEYS.map((key, i) =>
          key === "" ? (
            <span key={i} />
          ) : (
            <motion.button
              key={key}
              type="button"
              whileTap={{ scale: 0.92 }}
              disabled={disabled}
              aria-label={key === "back" ? "Delete" : key}
              onClick={() => {
                press(key);
              }}
              className={cn(
                "grid size-[76px] place-items-center rounded-pill text-title font-normal text-text-1 disabled:opacity-40",
                key === "back" ? "bg-transparent" : "bg-surface-2 active:bg-surface-3",
              )}
            >
              {key === "back" ? (
                <Delete aria-hidden="true" className="size-7" strokeWidth={1.75} />
              ) : (
                key
              )}
            </motion.button>
          ),
        )}
      </div>
    </div>
  );
}

import { motion } from "motion/react";
import { bucketColorVar } from "@/components/bucket-color";
import { BUCKET_COLORS, type BucketColor } from "@/domain/bucket-colors";
import { tapScale } from "@/lib/motion";
import { cn } from "@/lib/cn";

/** The 8 bucket colors (PRD §10.2) as round swatches. */
export function ColorPicker({
  value,
  onChange,
}: {
  value: BucketColor;
  onChange: (color: BucketColor) => void;
}) {
  return (
    <div role="radiogroup" aria-label="Color" className="flex justify-between">
      {BUCKET_COLORS.map((color) => {
        const selected = color === value;
        return (
          <motion.button
            key={color}
            type="button"
            role="radio"
            aria-checked={selected}
            aria-label={color}
            whileTap={tapScale}
            onClick={() => {
              onChange(color);
            }}
            className={cn(
              "grid size-11 place-items-center rounded-pill border-2 transition-colors",
              selected ? "border-text-1" : "border-transparent",
            )}
          >
            <span
              className="size-7 rounded-pill"
              style={{ backgroundColor: bucketColorVar(color) }}
            />
          </motion.button>
        );
      })}
    </div>
  );
}

import { LayoutGroup, motion } from "motion/react";
import { ToggleGroup } from "radix-ui";
import { useId } from "react";
import { spring } from "@/lib/motion";
import { cn } from "@/lib/cn";

interface SegmentedControlProps<T extends string> {
  options: readonly { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
  label: string;
  className?: string;
}

/** Two or three options in a pill, with a sliding white thumb (PRD §10.5). */
export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  label,
  className,
}: SegmentedControlProps<T>) {
  const groupId = useId();
  return (
    <LayoutGroup id={groupId}>
      <ToggleGroup.Root
        type="single"
        aria-label={label}
        value={value}
        onValueChange={(next) => {
          const option = options.find((o) => o.value === next);
          if (option) onChange(option.value);
        }}
        className={cn("flex h-11 rounded-pill border border-hairline bg-surface-2 p-1", className)}
      >
        {options.map((option) => {
          const active = option.value === value;
          return (
            <ToggleGroup.Item
              key={option.value}
              value={option.value}
              className={cn(
                "relative flex-1 rounded-pill px-4 text-callout font-semibold transition-colors",
                active ? "text-bg" : "text-text-2",
              )}
            >
              {active && (
                <motion.span
                  layoutId="thumb"
                  transition={spring}
                  className="absolute inset-0 rounded-pill bg-text-1"
                />
              )}
              <span className="relative">{option.label}</span>
            </ToggleGroup.Item>
          );
        })}
      </ToggleGroup.Root>
    </LayoutGroup>
  );
}

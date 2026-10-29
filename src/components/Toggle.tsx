import { Switch } from "radix-ui";
import { useId } from "react";

interface ToggleProps {
  label: string;
  description?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}

/** An iOS-style on/off switch with its label, 44 px+ tall. */
export function Toggle({ label, description, checked, onChange }: ToggleProps) {
  const id = useId();
  return (
    <div className="flex min-h-14 items-center gap-4 rounded-inner border border-hairline bg-surface-2 px-4 py-3">
      <label htmlFor={id} className="flex min-w-0 flex-1 flex-col">
        <span className="text-body text-text-1">{label}</span>
        {description !== undefined && (
          <span className="text-caption text-text-3">{description}</span>
        )}
      </label>
      <Switch.Root
        id={id}
        checked={checked}
        onCheckedChange={onChange}
        className="relative h-[31px] w-[51px] shrink-0 rounded-pill bg-surface-3 transition-colors data-[state=checked]:bg-positive"
      >
        <Switch.Thumb className="block size-[27px] translate-x-[2px] rounded-pill bg-text-1 transition-transform data-[state=checked]:translate-x-[22px]" />
      </Switch.Root>
    </div>
  );
}

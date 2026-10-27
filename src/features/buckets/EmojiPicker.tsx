import { TextField } from "@/components/TextField";
import { cn } from "@/lib/cn";
import { EMOJI_CHOICES, firstGrapheme } from "./emoji-choices";

/** A grid of common emoji, plus a field for typing any other one. */
export function EmojiPicker({ value, onPick }: { value: string; onPick: (emoji: string) => void }) {
  return (
    <div className="flex flex-col gap-3">
      <div role="radiogroup" aria-label="Emoji" className="grid grid-cols-6 gap-1">
        {EMOJI_CHOICES.map((emoji) => (
          <button
            key={emoji}
            type="button"
            role="radio"
            aria-checked={emoji === value}
            aria-label={emoji}
            onClick={() => {
              onPick(emoji);
            }}
            className={cn(
              "grid h-12 place-items-center rounded-inner text-[26px] leading-none",
              emoji === value ? "bg-surface-3" : "active:bg-surface-2",
            )}
          >
            {emoji}
          </button>
        ))}
      </div>
      <TextField
        label="Or type any emoji"
        placeholder="Tap here, then the 🌐 key for emoji"
        autoComplete="off"
        onChange={(e) => {
          const picked = firstGrapheme(e.target.value);
          if (picked !== "") onPick(picked);
        }}
      />
    </div>
  );
}

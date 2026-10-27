import { forwardRef, useId } from "react";
import { cn } from "@/lib/cn";

interface TextFieldProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "className"> {
  label: string;
  /** Hide the label visually but keep it for VoiceOver. */
  hideLabel?: boolean;
  hint?: string;
  error?: string | null;
  className?: string;
}

/** A single-line text input: 56 px tall, 16 px+ text so Safari never zooms (PRD §10.8). */
export const TextField = forwardRef<HTMLInputElement, TextFieldProps>(function TextField(
  { label, hideLabel = false, hint, error, className, ...props },
  ref,
) {
  const id = useId();
  const messageId = `${id}-message`;
  const message = error ?? hint;
  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <label htmlFor={id} className={cn("text-callout text-text-2", hideLabel && "sr-only")}>
        {label}
      </label>
      <input
        ref={ref}
        id={id}
        aria-invalid={error ? true : undefined}
        aria-describedby={message ? messageId : undefined}
        className={cn(
          "h-14 w-full rounded-inner border bg-surface-2 px-4 text-body text-text-1 placeholder:text-text-3",
          error ? "border-negative/60" : "border-hairline",
        )}
        {...props}
      />
      {message && (
        <p id={messageId} className={cn("text-caption", error ? "text-negative" : "text-text-3")}>
          {message}
        </p>
      )}
    </div>
  );
});

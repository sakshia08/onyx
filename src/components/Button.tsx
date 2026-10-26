import { cva, type VariantProps } from "class-variance-authority";
import { motion, type HTMLMotionProps } from "motion/react";
import { tapScale } from "@/lib/motion";
import { cn } from "@/lib/cn";

const buttonVariants = cva(
  "inline-flex shrink-0 items-center justify-center gap-2 rounded-pill font-semibold whitespace-nowrap transition-colors disabled:pointer-events-none disabled:opacity-40",
  {
    variants: {
      variant: {
        primary:
          "bg-text-1 text-bg disabled:bg-surface-2 disabled:text-text-3 disabled:opacity-100",
        secondary: "border border-hairline bg-surface-2 text-text-1 active:bg-surface-3",
        piggy: "bg-piggy text-bg",
        ghost: "text-text-1 active:bg-surface-2",
        destructive: "bg-negative/14 text-negative active:bg-negative/22",
      },
      size: {
        lg: "h-14 px-7 text-headline",
        md: "h-11 px-5 text-callout",
        icon: "size-11 text-callout",
      },
    },
    defaultVariants: { variant: "primary", size: "md" },
  },
);

type ButtonProps = Omit<HTMLMotionProps<"button">, "children"> &
  VariantProps<typeof buttonVariants> & { children?: React.ReactNode };

export function Button({ className, variant, size, type = "button", ...props }: ButtonProps) {
  return (
    <motion.button
      type={type}
      whileTap={tapScale}
      className={cn(buttonVariants({ variant, size }), className)}
      {...props}
    />
  );
}

import { cn } from "@/lib/cn";

/** Layered surface with a hairline border (PRD §10.4: depth without heavy shadows). */
export function Card({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("rounded-card border border-hairline bg-surface-1 p-5", className)}
      {...props}
    />
  );
}

import { cn } from "@/lib/cn";

interface SectionHeaderProps {
  title: string;
  /** Optional right-hand content, e.g. a "See all" link or a total. */
  trailing?: React.ReactNode;
  className?: string;
}

export function SectionHeader({ title, trailing, className }: SectionHeaderProps) {
  return (
    <div className={cn("mb-3 flex items-end justify-between gap-4", className)}>
      <h2 className="text-headline text-text-1">{title}</h2>
      {trailing !== undefined && <div className="text-callout text-text-2">{trailing}</div>}
    </div>
  );
}

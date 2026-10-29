import { ChevronRight } from "lucide-react";
import { Link } from "react-router";
import { cn } from "@/lib/cn";

/** A grouped list, iOS Settings style. */
export function SettingsGroup({
  title,
  children,
  note,
}: {
  title?: string;
  children: React.ReactNode;
  note?: string;
}) {
  return (
    <section aria-label={title} className="mt-section">
      {title !== undefined && <h2 className="micro-label mb-2 px-1">{title}</h2>}
      <div className="overflow-hidden rounded-card border border-hairline bg-surface-1 [&>*+*]:border-t [&>*+*]:border-hairline">
        {children}
      </div>
      {note !== undefined && <p className="mt-2 px-1 text-caption text-text-3">{note}</p>}
    </section>
  );
}

interface RowProps {
  icon: React.ReactNode;
  label: string;
  value?: React.ReactNode;
  tone?: "default" | "warning" | "danger";
  to?: string;
  onClick?: () => void;
}

/** One row: an icon, a label, an optional value, and a chevron when it goes somewhere. */
export function SettingsRow({ icon, label, value, tone = "default", to, onClick }: RowProps) {
  const inner = (
    <>
      <span
        aria-hidden="true"
        className={cn(
          "grid size-9 shrink-0 place-items-center rounded-inner",
          tone === "danger" ? "bg-negative/14 text-negative" : "bg-surface-2 text-text-1",
        )}
      >
        {icon}
      </span>
      <span
        className={cn(
          "min-w-0 flex-1 truncate text-body",
          tone === "danger" ? "text-negative" : "text-text-1",
        )}
      >
        {label}
      </span>
      {value !== undefined && (
        <span
          className={cn(
            "shrink-0 text-callout",
            tone === "warning" ? "text-warning" : "text-text-3",
          )}
        >
          {value}
        </span>
      )}
      {(to !== undefined || onClick !== undefined) && tone !== "danger" && (
        <ChevronRight aria-hidden="true" className="size-4 shrink-0 text-text-3" />
      )}
    </>
  );
  const className = "flex min-h-14 w-full items-center gap-3 px-4 py-2.5 text-left";
  if (to !== undefined) {
    return (
      <Link to={to} className={className}>
        {inner}
      </Link>
    );
  }
  if (onClick !== undefined) {
    return (
      <button type="button" onClick={onClick} className={className}>
        {inner}
      </button>
    );
  }
  return <div className={className}>{inner}</div>;
}

interface PreviewSectionProps {
  id: string;
  title: string;
  note?: string;
  children: React.ReactNode;
}

/** One labelled block on the design preview page. */
export function PreviewSection({ id, title, note, children }: PreviewSectionProps) {
  return (
    <section id={id} aria-labelledby={`${id}-title`} className="mt-section scroll-mt-6">
      <h2 id={`${id}-title`} className="micro-label">
        {title}
      </h2>
      {note !== undefined && <p className="mt-1 text-caption text-text-3">{note}</p>}
      <div className="mt-3">{children}</div>
    </section>
  );
}

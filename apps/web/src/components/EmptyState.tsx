import { useId, type ReactNode } from 'react';

/** Consistent empty state: a heading (findable with getByRole('heading')) plus guidance. */
export function EmptyState({ title, children }: { title: string; children?: ReactNode }) {
  const titleId = useId();
  return (
    <section
      aria-labelledby={titleId}
      className="rounded-[var(--radius)] border border-dashed bg-card p-10 text-center"
    >
      <h2 id={titleId} className="text-lg font-medium">
        {title}
      </h2>
      {children && <div className="mt-2 text-muted-foreground">{children}</div>}
    </section>
  );
}

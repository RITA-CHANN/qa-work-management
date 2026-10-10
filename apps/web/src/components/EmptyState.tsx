import { useId, type ReactNode } from 'react';

/**
 * Consistent empty state: a heading (findable with getByRole('heading')) plus guidance.
 * `live` puts it in role="status", for an empty state that appears after a search (WCAG 4.1.3).
 */
export function EmptyState({
  title,
  children,
  live = false,
}: {
  title: string;
  children?: ReactNode;
  live?: boolean;
}) {
  const titleId = useId();
  return (
    <section
      aria-labelledby={titleId}
      role={live ? 'status' : undefined}
      className="rounded-[var(--radius)] border border-dashed bg-card p-10 text-center"
    >
      <h2 id={titleId} className="text-lg font-medium">
        {title}
      </h2>
      {children && <div className="mt-2 text-muted-foreground">{children}</div>}
    </section>
  );
}

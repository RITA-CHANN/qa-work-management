import { useId, type ReactNode } from 'react';
import { cn } from '@/lib/utils';

/** White panel on the grey ground (tokens v2.1). With a title it is a labelled <section>. */
export function Card({
  title,
  actions,
  children,
  className,
}: {
  title?: string;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  const titleId = useId();
  return (
    <section
      aria-labelledby={title ? titleId : undefined}
      className={cn('rounded-[var(--radius)] border bg-card p-5 shadow-card', className)}
    >
      {title && (
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 id={titleId} className="text-[15px] font-semibold">
            {title}
          </h2>
          {actions}
        </div>
      )}
      {children}
    </section>
  );
}

/** One number with its label, for KPI rows. */
export function KpiCard({
  label,
  value,
  hint,
  tone = 'neutral',
  mono = false,
}: {
  label: string;
  value: ReactNode;
  hint?: ReactNode;
  tone?: 'neutral' | 'warning' | 'danger' | 'success';
  /** Monospace digits for numbers and IDs; names and dates read better in the UI font. */
  mono?: boolean;
}) {
  const toneClass = {
    neutral: 'text-foreground',
    warning: 'text-warning-foreground',
    danger: 'text-destructive',
    success: 'text-success',
  }[tone];
  return (
    <div className="rounded-[var(--radius)] border bg-card p-4 shadow-card">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <p className={cn('mt-1 text-2xl font-bold', mono && 'font-mono', toneClass)}>{value}</p>
      {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

/** Horizontal progress bar with an accessible value. */
export function ProgressBar({ value, label }: { value: number; label: string }) {
  const pct = Math.max(0, Math.min(100, Math.round(value)));
  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuenow={pct}
      aria-valuemin={0}
      aria-valuemax={100}
      className="h-2 w-full overflow-hidden rounded-full bg-muted"
    >
      <div className="h-full rounded-full bg-primary" style={{ width: `${pct}%` }} />
    </div>
  );
}

import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

const tones = {
  neutral: 'border-border bg-muted text-foreground',
  active: 'border-success/40 bg-success/10 text-foreground',
  warning: 'border-destructive/40 bg-destructive/10 text-foreground',
} as const;

/** A small text label (status, role). Always text, never colour alone (WCAG 1.4.1). */
export function Badge({
  children,
  tone = 'neutral',
  className,
}: {
  children: ReactNode;
  tone?: keyof typeof tones;
  className?: string;
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium',
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

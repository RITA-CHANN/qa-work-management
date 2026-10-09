import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

const tones = {
  neutral: 'border-border bg-muted text-foreground',
  info: 'border-transparent bg-primary-tint text-primary-tint-foreground',
  active: 'border-transparent bg-success-tint text-success',
  warning: 'border-transparent bg-warning-tint text-warning-foreground',
  danger: 'border-transparent bg-destructive-tint text-destructive',
  admin: 'border-transparent bg-admin text-admin-foreground',
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
        'inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-semibold',
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

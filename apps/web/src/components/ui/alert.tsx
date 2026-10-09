import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

/** An error the user must notice now (role="alert": read out as soon as it appears). */
export function Alert({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div
      role="alert"
      className={cn(
        'flex flex-wrap items-center gap-3 rounded-md border border-destructive/50 px-3 py-2 text-sm text-destructive',
        className,
      )}
    >
      {children}
    </div>
  );
}

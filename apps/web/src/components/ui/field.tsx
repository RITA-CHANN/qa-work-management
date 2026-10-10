import { useId, type ComponentProps, type ReactNode } from 'react';
import { cn } from '@/lib/utils';

export const inputClass =
  'h-9 w-full rounded-md border bg-background px-3 text-sm outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 aria-invalid:border-destructive disabled:opacity-60';

type FieldProps = {
  label: string;
  error?: string;
  hint?: ReactNode;
  className?: string;
};

/**
 * A labelled form field. The error is linked with aria-describedby and marks the input aria-invalid,
 * so a test can use getByLabel('Name') and a screen reader reads the message.
 */
export function FieldShell({
  label,
  error,
  hint,
  className,
  children,
}: FieldProps & { children: (ids: { id: string; describedBy?: string }) => ReactNode }) {
  const id = useId();
  const hintId = `${id}-hint`;
  const errorId = `${id}-error`;
  const describedBy = [hint ? hintId : null, error ? errorId : null].filter(Boolean).join(' ');
  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      <label htmlFor={id} className="text-sm font-medium">
        {label}
      </label>
      {children({ id, describedBy: describedBy || undefined })}
      {hint && (
        <p id={hintId} className="text-xs text-muted-foreground">
          {hint}
        </p>
      )}
      {error && (
        <p id={errorId} className="text-sm text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}

export function TextField({
  label,
  error,
  hint,
  className,
  ...input
}: FieldProps & Omit<ComponentProps<'input'>, 'className'>) {
  return (
    <FieldShell label={label} error={error} hint={hint} className={className}>
      {({ id, describedBy }) => (
        <input
          id={id}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          className={inputClass}
          {...input}
        />
      )}
    </FieldShell>
  );
}

export function TextAreaField({
  label,
  error,
  hint,
  className,
  ...textarea
}: FieldProps & Omit<ComponentProps<'textarea'>, 'className'>) {
  return (
    <FieldShell label={label} error={error} hint={hint} className={className}>
      {({ id, describedBy }) => (
        <textarea
          id={id}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          className={cn(inputClass, 'h-auto min-h-20 py-2')}
          {...textarea}
        />
      )}
    </FieldShell>
  );
}

export function SelectField({
  label,
  error,
  hint,
  className,
  children,
  ...select
}: FieldProps & Omit<ComponentProps<'select'>, 'className'>) {
  return (
    <FieldShell label={label} error={error} hint={hint} className={className}>
      {({ id, describedBy }) => (
        <select
          id={id}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          className={inputClass}
          {...select}
        >
          {children}
        </select>
      )}
    </FieldShell>
  );
}

import type { z } from 'zod';
import { ApiRequestError } from '@/lib/api-client';

export type FieldErrors = Record<string, string | undefined>;

/** First message per field from a Zod error: { key: msg('MSG-PROJECT-01'), … }. */
export function zodFieldErrors(error: z.ZodError): FieldErrors {
  const errors: FieldErrors = {};
  for (const issue of error.issues) {
    const field = String(issue.path[0] ?? '');
    errors[field] ??= issue.message;
  }
  return errors;
}

/** Field messages from a 400 problem (`errors[].pointer` is "/name"). */
export function serverFieldErrors(error: unknown): FieldErrors {
  const errors: FieldErrors = {};
  if (error instanceof ApiRequestError) {
    for (const { pointer, detail } of error.errors) errors[pointer.slice(1)] ??= detail;
  }
  return errors;
}

/** Puts focus on the first invalid field of a form, so keyboard and screen-reader users land on it. */
export function focusFirstInvalid(form: HTMLFormElement | null) {
  requestAnimationFrame(() => {
    form?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus();
  });
}

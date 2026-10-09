import { msg } from '@qawm/shared';
import { ApiRequestError } from '@/lib/api-client';

/** The text to show for a failed request: the server's message, or the generic one (MSG-COMMON-01). */
export function errorText(error: unknown): string {
  if (error instanceof ApiRequestError && error.status > 0 && error.status < 500)
    return error.message;
  return msg('MSG-COMMON-01');
}

export const isConflict = (error: unknown) =>
  error instanceof ApiRequestError && error.code === 'VERSION_CONFLICT';

export const isNotFound = (error: unknown) =>
  error instanceof ApiRequestError && error.status === 404;

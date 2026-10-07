/**
 * The response envelope every API endpoint uses.
 * Keeping one shape everywhere means API tests can share assertions.
 */

export type ApiSuccess<T> = { data: T };

export type PaginationMeta = { page: number; pageSize: number; total: number };

export type ApiList<T> = { data: T[]; meta: PaginationMeta };

export const ERROR_CODES = [
  'VALIDATION_ERROR',
  'UNAUTHENTICATED',
  'FORBIDDEN',
  'NOT_FOUND',
  'CONFLICT',
  'UNPROCESSABLE',
  'RATE_LIMITED',
  'INTERNAL_ERROR',
  'SERVICE_UNAVAILABLE',
] as const;

export type ErrorCode = (typeof ERROR_CODES)[number];

export type ErrorDetail = { path: string; message: string };

export type ApiError = {
  error: {
    code: ErrorCode;
    message: string;
    details?: ErrorDetail[];
    /** Matches the X-Request-Id response header and the server log line. */
    requestId: string;
  };
};

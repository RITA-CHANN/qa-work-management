import { z } from 'zod';
import type { MessageCode } from './messages';

/**
 * The response envelope every API endpoint uses for success.
 * Keeping one shape everywhere means API tests can share assertions.
 */

export type ApiSuccess<T> = { data: T };

export type PaginationMeta = { page: number; pageSize: number; total: number };

export type ApiList<T> = { data: T[]; meta: PaginationMeta };

/** A page of a cursor-paginated list (activity log). `nextCursor` is null on the last page. */
export type ApiCursorPage<T> = { data: T[]; meta: { nextCursor: string | null } };

export const ERROR_CODES = [
  'VALIDATION_ERROR',
  'UNAUTHENTICATED',
  'FORBIDDEN',
  'NOT_FOUND',
  'CONFLICT',
  'UNSUPPORTED_MEDIA_TYPE',
  'UNPROCESSABLE',
  'RATE_LIMITED',
  'INTERNAL_ERROR',
  'SERVICE_UNAVAILABLE',
  // Phase 3 (docs/api/README.md#phase-3-codes)
  'KEY_TAKEN',
  'ALREADY_MEMBER',
  'VERSION_CONFLICT',
  'INVALID_TRANSITION',
  'RELEASE_NAME_TAKEN',
  'MILESTONE_NAME_TAKEN',
  'PROJECT_ARCHIVED',
  'DELETE_NOT_ALLOWED',
  'LAST_OWNER',
  'OWN_ROLE',
  'ACTIVE_RELEASE_EXISTS',
  'OPEN_MILESTONES',
  'CANNOT_ACTIVATE_MILESTONE',
  'MILESTONE_OUTSIDE_RELEASE',
  'MILESTONE_OVERLAP',
  'RELEASE_CLOSED',
  // Phase 3C (docs/api/README.md#phase-3c-codes)
  'EMAIL_TAKEN',
  'LAST_ADMIN',
  'OWN_ACCOUNT',
  'LAST_PROJECT_ADMIN',
  'ACCOUNT_DEACTIVATED',
  'PASSWORD_CHANGE_REQUIRED',
] as const;

export type ErrorCode = (typeof ERROR_CODES)[number];

/** One invalid field of a 400. `pointer` is a JSON Pointer into the body or query (`/name`). */
export const fieldErrorSchema = z.object({
  pointer: z.string(),
  detail: z.string(),
  messageId: z.string().optional(),
});

export type FieldError = z.infer<typeof fieldErrorSchema>;

/**
 * Every error response: RFC 9457 problem details (`application/problem+json`) with our extension
 * members `code`, `messageId`, `errors` and `requestId`. ADR-0010.
 */
export const problemSchema = z.object({
  type: z.string(),
  title: z.string(),
  status: z.number().int(),
  detail: z.string(),
  instance: z.string(),
  code: z.enum(ERROR_CODES),
  messageId: z.string(),
  errors: z.array(fieldErrorSchema).optional(),
  /** Matches the X-Request-Id response header and the server log line. */
  requestId: z.string(),
});

export type Problem = z.infer<typeof problemSchema> & { messageId: MessageCode };

export const PROBLEM_CONTENT_TYPE = 'application/problem+json';

/** `type` URI of a problem: one per code (VERSION_CONFLICT → …/problems/version-conflict). */
export function problemType(code: ErrorCode): string {
  return `https://qawm.test/problems/${code.toLowerCase().replaceAll('_', '-')}`;
}

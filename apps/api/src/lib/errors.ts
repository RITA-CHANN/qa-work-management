import {
  messageIdOf,
  msg,
  type ErrorCode,
  type FieldError,
  type MessageCode,
  type MessageValues,
} from '@qawm/shared';
import type { z } from 'zod';

/**
 * Base class for errors we expect and want to show to the client. The error handler turns it into an
 * RFC 9457 problem details body (ADR-0010). Anything that is not an AppError becomes a generic 500.
 */
export class AppError extends Error {
  readonly messageId: MessageCode;

  constructor(
    readonly status: number,
    readonly code: ErrorCode,
    messageId: MessageCode,
    values?: MessageValues,
    readonly errors?: FieldError[],
  ) {
    super(msg(messageId, values));
    this.name = new.target.name;
    this.messageId = messageId;
  }
}

/** 400. `errors` lists each invalid field. */
export class ValidationError extends AppError {
  constructor(errors: FieldError[], messageId: MessageCode = 'MSG-COMMON-04') {
    super(400, 'VALIDATION_ERROR', messageId, undefined, errors);
  }

  /** One invalid field, for checks the schema can't do alone (a date against the stored one). */
  static field(pointer: string, messageId: MessageCode, values?: MessageValues) {
    return new ValidationError([{ pointer, detail: msg(messageId, values), messageId }]);
  }
}

export class UnauthenticatedError extends AppError {
  constructor(messageId: MessageCode = 'MSG-COMMON-05') {
    super(401, 'UNAUTHENTICATED', messageId);
  }
}

export class ForbiddenError extends AppError {
  constructor(code: ErrorCode = 'FORBIDDEN', messageId: MessageCode = 'MSG-COMMON-06') {
    super(403, code, messageId);
  }
}

export class NotFoundError extends AppError {
  constructor(messageId: MessageCode = 'MSG-COMMON-07', values?: MessageValues) {
    super(404, 'NOT_FOUND', messageId, values);
  }
}

/** 409: the request conflicts with the current state (duplicate, stale version, status backwards). */
export class ConflictError extends AppError {
  constructor(code: ErrorCode, messageId: MessageCode, values?: MessageValues) {
    super(409, code, messageId, values);
  }
}

/** 422: valid input that breaks a business rule (archived project, last owner, …). */
export class UnprocessableError extends AppError {
  constructor(code: ErrorCode, messageId: MessageCode, values?: MessageValues) {
    super(422, code, messageId, values);
  }
}

export class UnsupportedMediaTypeError extends AppError {
  constructor() {
    super(415, 'UNSUPPORTED_MEDIA_TYPE', 'MSG-COMMON-09');
  }
}

export class RateLimitedError extends AppError {
  constructor(messageId: MessageCode) {
    super(429, 'RATE_LIMITED', messageId);
  }
}

/** Zod issues as RFC 9457 field errors: `/name`, `/dates/0` (JSON Pointer). */
export function toFieldErrors(issues: z.core.$ZodIssue[]): FieldError[] {
  const pointer = (path: PropertyKey[]) => '/' + path.map((part) => String(part)).join('/');
  return issues.flatMap((issue): FieldError[] => {
    // A field the endpoint doesn't accept (mass assignment, NFR-PROJECT-04): one error per field.
    if (issue.code === 'unrecognized_keys') {
      return issue.keys.map((key) => ({
        pointer: pointer([...issue.path, key]),
        detail: 'This field is not allowed',
      }));
    }
    const messageId = messageIdOf(issue.message);
    return [
      { pointer: pointer(issue.path), detail: issue.message, ...(messageId ? { messageId } : {}) },
    ];
  });
}

/** Parses a body or query with a schema; a failure is a 400 listing every invalid field. */
export function parseOrThrow<S extends z.ZodType>(schema: S, input: unknown): z.output<S> {
  const result = schema.safeParse(input ?? {});
  if (!result.success) throw new ValidationError(toFieldErrors(result.error.issues));
  return result.data;
}

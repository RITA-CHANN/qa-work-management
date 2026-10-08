import { msg, type ErrorCode, type ErrorDetail } from '@qawm/shared';

/**
 * Base class for errors we expect and want to show to the client.
 * Anything that is not an AppError becomes a generic 500.
 */
export class AppError extends Error {
  constructor(
    readonly status: number,
    readonly code: ErrorCode,
    message: string,
    readonly details?: ErrorDetail[],
  ) {
    super(message);
    this.name = new.target.name;
  }
}

export class ValidationError extends AppError {
  constructor(details: ErrorDetail[], message = msg('MSG-COMMON-04')) {
    super(400, 'VALIDATION_ERROR', message, details);
  }
}

export class UnauthenticatedError extends AppError {
  constructor(message = msg('MSG-COMMON-05')) {
    super(401, 'UNAUTHENTICATED', message);
  }
}

export class ForbiddenError extends AppError {
  constructor(message = msg('MSG-COMMON-06')) {
    super(403, 'FORBIDDEN', message);
  }
}

export class NotFoundError extends AppError {
  constructor(message = msg('MSG-COMMON-07')) {
    super(404, 'NOT_FOUND', message);
  }
}

export class ConflictError extends AppError {
  constructor(message: string, details?: ErrorDetail[]) {
    super(409, 'CONFLICT', message, details);
  }
}

export class UnsupportedMediaTypeError extends AppError {
  constructor(message = msg('MSG-COMMON-09')) {
    super(415, 'UNSUPPORTED_MEDIA_TYPE', message);
  }
}

export class RateLimitedError extends AppError {
  constructor(message: string) {
    super(429, 'RATE_LIMITED', message);
  }
}

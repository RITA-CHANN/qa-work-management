import type { ErrorRequestHandler } from 'express';
import { COMMON_MESSAGES, type ApiError } from '@qawm/shared';
import { AppError } from '../lib/errors';

function isJsonSyntaxError(err: unknown): boolean {
  return (
    err instanceof SyntaxError &&
    (err as SyntaxError & { type?: string }).type === 'entity.parse.failed'
  );
}

/**
 * The single place that turns errors into HTTP responses.
 * Expected errors keep their status and message; unexpected ones become a generic 500
 * (details stay in the server log, never in the response).
 */
export const errorHandler: ErrorRequestHandler = (err: unknown, req, res, _next) => {
  let status = 500;
  let body: ApiError['error'] = {
    code: 'INTERNAL_ERROR',
    message: COMMON_MESSAGES.serverError,
    requestId: req.requestId,
  };

  if (err instanceof AppError) {
    status = err.status;
    body = { code: err.code, message: err.message, requestId: req.requestId };
    if (err.details) body.details = err.details;
  } else if (isJsonSyntaxError(err)) {
    status = 400;
    body = {
      code: 'VALIDATION_ERROR',
      message: COMMON_MESSAGES.invalidJson,
      requestId: req.requestId,
    };
  }

  if (status >= 500) {
    req.log.error({ err }, 'Unhandled error');
  } else {
    req.log.info({ code: body.code, status }, body.message);
  }

  res.status(status).json({ error: body } satisfies ApiError);
};

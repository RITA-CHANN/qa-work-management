import type { ErrorRequestHandler } from 'express';
import {
  msg,
  PROBLEM_CONTENT_TYPE,
  problemType,
  type ErrorCode,
  type FieldError,
  type MessageCode,
  type Problem,
} from '@qawm/shared';
import { AppError } from '../lib/errors';

/** Short, fixed summary of each problem type (RFC 9457 `title`). */
const TITLES: Record<ErrorCode, string> = {
  VALIDATION_ERROR: 'Validation error',
  UNAUTHENTICATED: 'Unauthenticated',
  FORBIDDEN: 'Forbidden',
  NOT_FOUND: 'Not found',
  CONFLICT: 'Conflict',
  UNSUPPORTED_MEDIA_TYPE: 'Unsupported media type',
  UNPROCESSABLE: 'Unprocessable',
  RATE_LIMITED: 'Too many requests',
  INTERNAL_ERROR: 'Internal error',
  SERVICE_UNAVAILABLE: 'Service unavailable',
  KEY_TAKEN: 'Key already in use',
  ALREADY_MEMBER: 'Already a member',
  VERSION_CONFLICT: 'Edited by someone else',
  INVALID_TRANSITION: 'Invalid status change',
  RELEASE_NAME_TAKEN: 'Release name already in use',
  MILESTONE_NAME_TAKEN: 'Milestone name already in use',
  PROJECT_ARCHIVED: 'Project is archived',
  DELETE_NOT_ALLOWED: 'Delete not allowed',
  LAST_OWNER: 'Last owner',
  OWN_ROLE: 'Own role',
  ACTIVE_RELEASE_EXISTS: 'Another release is active',
  OPEN_MILESTONES: 'Release has open milestones',
  CANNOT_ACTIVATE_MILESTONE: 'Milestone cannot be activated',
  MILESTONE_OUTSIDE_RELEASE: 'Milestone outside its release',
  MILESTONE_OVERLAP: 'Milestones overlap',
  RELEASE_CLOSED: 'Release is released',
};

function isJsonSyntaxError(err: unknown): boolean {
  return (
    err instanceof SyntaxError &&
    (err as SyntaxError & { type?: string }).type === 'entity.parse.failed'
  );
}

type Parts = {
  status: number;
  code: ErrorCode;
  messageId: MessageCode;
  detail: string;
  errors?: FieldError[];
};

function partsOf(err: unknown): Parts {
  if (err instanceof AppError) {
    return {
      status: err.status,
      code: err.code,
      messageId: err.messageId,
      detail: err.message,
      errors: err.errors,
    };
  }
  if (isJsonSyntaxError(err)) {
    const messageId = 'MSG-COMMON-03';
    return { status: 400, code: 'VALIDATION_ERROR', messageId, detail: msg(messageId), errors: [] };
  }
  const messageId = 'MSG-COMMON-02';
  return { status: 500, code: 'INTERNAL_ERROR', messageId, detail: msg(messageId) };
}

/**
 * The single place that turns errors into HTTP responses: RFC 9457 problem details (ADR-0010).
 * Expected errors keep their status and message; unexpected ones become a generic 500
 * (details stay in the server log, never in the response).
 */
export const errorHandler: ErrorRequestHandler = (err: unknown, req, res, _next) => {
  const { status, code, messageId, detail, errors } = partsOf(err);
  const body: Problem = {
    type: problemType(code),
    title: TITLES[code],
    status,
    detail,
    instance: req.originalUrl.split('?')[0] ?? req.originalUrl,
    code,
    messageId,
    ...(errors ? { errors } : {}),
    requestId: req.requestId,
  };

  if (status >= 500) {
    req.log.error({ err }, 'Unhandled error');
  } else {
    req.log.info({ code, status }, detail);
  }

  res.status(status).type(PROBLEM_CONTENT_TYPE).send(JSON.stringify(body));
};

import type { RequestHandler } from 'express';
import { COMMON_MESSAGES, formatMessage } from '@qawm/shared';
import { NotFoundError } from '../lib/errors';

/** Unknown /api routes return the standard JSON error instead of Express's HTML page. */
export const notFound: RequestHandler = (req) => {
  const path = req.originalUrl.split('?')[0];
  throw new NotFoundError(
    formatMessage(COMMON_MESSAGES.routeNotFound, { method: req.method, path }),
  );
};

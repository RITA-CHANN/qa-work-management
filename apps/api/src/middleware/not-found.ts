import type { RequestHandler } from 'express';
import { msg } from '@qawm/shared';
import { NotFoundError } from '../lib/errors';

/** Unknown /api routes return the standard JSON error instead of Express's HTML page. */
export const notFound: RequestHandler = (req) => {
  const path = req.originalUrl.split('?')[0] ?? req.originalUrl;
  throw new NotFoundError(msg('MSG-COMMON-08', { method: req.method, path }));
};

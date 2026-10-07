import type { RequestHandler } from 'express';
import { NotFoundError } from '../lib/errors';

/** Unknown /api routes return the standard JSON error instead of Express's HTML page. */
export const notFound: RequestHandler = (req) => {
  const path = req.originalUrl.split('?')[0];
  throw new NotFoundError(`Route ${req.method} ${path} does not exist`);
};

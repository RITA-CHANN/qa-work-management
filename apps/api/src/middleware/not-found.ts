import type { RequestHandler } from 'express';
import { NotFoundError } from '../lib/errors';

/** Unknown /api routes return the standard problem details error instead of Express's HTML page. */
export const notFound: RequestHandler = (req) => {
  const path = req.originalUrl.split('?')[0] ?? req.originalUrl;
  throw new NotFoundError('MSG-COMMON-08', { method: req.method, path });
};

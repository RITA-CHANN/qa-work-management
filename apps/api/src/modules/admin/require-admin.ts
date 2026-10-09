import type { RequestHandler } from 'express';
import { NotFoundError } from '../../lib/errors';

/**
 * Lets only System admins through. Everyone else gets the same 404 as an unknown route, so the
 * Admin console can't even be detected (BR-ADMIN-01). Mount after requireAuth.
 */
export const requireAdmin: RequestHandler = (req, _res, next) => {
  if (req.user?.globalRole !== 'ADMIN') {
    const path = req.originalUrl.split('?')[0] ?? req.originalUrl;
    throw new NotFoundError('MSG-COMMON-08', { method: req.method, path });
  }
  next();
};

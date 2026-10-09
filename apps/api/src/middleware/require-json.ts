import type { Request, RequestHandler } from 'express';
import { UnsupportedMediaTypeError } from '../lib/errors';

const WRITE_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

/**
 * CSRF guard (DD-AUTH-02): an HTML form on another site can't send application/json,
 * so writes without it are rejected with 415. A DELETE without a body is allowed: a form can't send
 * DELETE at all, and a cross-site script that tries needs a CORS preflight the API never grants.
 */
export const requireJson: RequestHandler = (req, _res, next) => {
  const bodyless = req.method === 'DELETE' && !hasBody(req);
  if (WRITE_METHODS.has(req.method) && !bodyless && !req.is('application/json')) {
    throw new UnsupportedMediaTypeError();
  }
  next();
};

function hasBody(req: Request): boolean {
  return (
    req.headers['transfer-encoding'] !== undefined || Number(req.headers['content-length'] ?? 0) > 0
  );
}

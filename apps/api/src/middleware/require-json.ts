import type { RequestHandler } from 'express';
import { UnsupportedMediaTypeError } from '../lib/errors';

const WRITE_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

/**
 * CSRF guard (DD-AUTH-02): an HTML form on another site can't send application/json,
 * so writes without it are rejected with 415.
 */
export const requireJson: RequestHandler = (req, _res, next) => {
  if (WRITE_METHODS.has(req.method) && !req.is('application/json')) {
    throw new UnsupportedMediaTypeError();
  }
  next();
};

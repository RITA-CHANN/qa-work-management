import type { RequestHandler } from 'express';
import { ForbiddenError, UnauthenticatedError } from '../lib/errors';
import { findSessionUser, SESSION_COOKIE, sessionCookieOptions } from '../modules/auth/session';

/**
 * Lets the request through only with a valid, unexpired session (DD-AUTH-02).
 * Every failure is the same 401, so a caller can't tell why.
 */
export const requireAuth: RequestHandler = async (req, res, next) => {
  const token: string | undefined = req.cookies?.[SESSION_COOKIE];
  const session = token ? await findSessionUser(token) : null;
  if (!session) {
    if (token) {
      const { maxAge: _maxAge, ...options } = sessionCookieOptions();
      res.clearCookie(SESSION_COOKIE, options);
    }
    throw new UnauthenticatedError();
  }
  req.user = session.user;
  req.sessionIdHash = session.idHash;
  // A one-time password only lets the user read who they are and set a new password (BR-ADMIN-07).
  if (
    session.user.mustChangePassword &&
    !PASSWORD_CHANGE_ROUTES.has(req.originalUrl.split('?')[0]!)
  ) {
    throw new ForbiddenError('PASSWORD_CHANGE_REQUIRED', 'MSG-ADMIN-07');
  }
  next();
};

const PASSWORD_CHANGE_ROUTES = new Set(['/api/auth/me', '/api/auth/change-password']);

import type { RequestHandler } from 'express';
import { UnauthenticatedError } from '../lib/errors';
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
  next();
};

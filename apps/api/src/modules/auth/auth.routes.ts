import { Router } from 'express';
import { loginRequestSchema, type ApiSuccess, type AuthUser } from '@qawm/shared';
import { parseOrThrow } from '../../lib/errors';
import { requireAuth } from '../../middleware/require-auth';
import { login } from './auth.service';
import { deleteSession, SESSION_COOKIE, sessionCookieOptions } from './session';

/** Login and logout work without a session. */
export const publicAuthRouter = Router();

/** POST /api/auth/login (API-AUTH-01) */
publicAuthRouter.post('/login', async (req, res) => {
  const body = parseOrThrow(loginRequestSchema, req.body);
  const { user, token } = await login(body, req.cookies?.[SESSION_COOKIE]);
  res.cookie(SESSION_COOKIE, token, sessionCookieOptions());
  res.json({ data: user } satisfies ApiSuccess<AuthUser>);
});

/** POST /api/auth/logout (API-AUTH-02). Always 204, so it is safe to repeat. */
publicAuthRouter.post('/logout', async (req, res) => {
  const token: string | undefined = req.cookies?.[SESSION_COOKIE];
  if (token) await deleteSession(token);
  const { maxAge: _maxAge, ...options } = sessionCookieOptions();
  res.clearCookie(SESSION_COOKIE, options);
  res.status(204).end();
});

/** Needs a session. Mounted with requireAuth. */
export const authRouter = Router();
authRouter.use(requireAuth);

/** GET /api/auth/me (API-AUTH-03) */
authRouter.get('/me', (req, res) => {
  res.json({ data: req.user! } satisfies ApiSuccess<AuthUser>);
});

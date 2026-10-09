import { Router } from 'express';
import {
  changePasswordSchema,
  loginRequestSchema,
  type ApiSuccess,
  type AuthUser,
} from '@qawm/shared';
import { parseOrThrow } from '../../lib/errors';
import { requireAuth } from '../../middleware/require-auth';
import { prisma } from '../../lib/prisma';
import { recordAudit } from '../audit/record-audit';
import { changePassword, login } from './auth.service';
import { deleteSession, findSessionUser, SESSION_COOKIE, sessionCookieOptions } from './session';

/** Login and logout work without a session. */
export const publicAuthRouter = Router();

/** POST /api/auth/login (API-AUTH-01) */
publicAuthRouter.post('/login', async (req, res) => {
  const body = parseOrThrow(loginRequestSchema, req.body);
  const { user, token } = await login(body, req.cookies?.[SESSION_COOKIE], req.ip ?? null);
  res.cookie(SESSION_COOKIE, token, sessionCookieOptions());
  res.json({ data: user } satisfies ApiSuccess<AuthUser>);
});

/** POST /api/auth/logout (API-AUTH-02). Always 204, so it is safe to repeat. */
publicAuthRouter.post('/logout', async (req, res) => {
  const token: string | undefined = req.cookies?.[SESSION_COOKIE];
  if (token) {
    const session = await findSessionUser(token);
    await deleteSession(token);
    if (session) {
      await recordAudit(prisma, {
        actorId: session.user.id,
        action: 'auth.sign_out',
        targetType: 'session',
        targetName: session.user.email,
        ip: req.ip ?? null,
      });
    }
  }
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

/** POST /api/auth/change-password (API-AUTH-04): replaces a one-time password (BR-ADMIN-07). */
authRouter.post('/change-password', async (req, res) => {
  const body = parseOrThrow(changePasswordSchema, req.body);
  const user = await changePassword(req.user!, req.sessionIdHash!, body, req.ip ?? null);
  res.json({ data: user } satisfies ApiSuccess<AuthUser>);
});

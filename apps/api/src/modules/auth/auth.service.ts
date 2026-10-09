import { type AuthUser, type LoginRequest } from '@qawm/shared';
import { env } from '../../config/env';
import { RateLimitedError, UnauthenticatedError } from '../../lib/errors';
import { prisma } from '../../lib/prisma';
import { verifyPassword } from './password';
import { LoginRateLimiter } from './rate-limit';
import { createSession, deleteSession } from './session';

export const loginRateLimiter = new LoginRateLimiter(
  env.LOGIN_RATE_LIMIT_MAX,
  env.LOGIN_RATE_LIMIT_WINDOW_MIN * 60 * 1000,
);

/**
 * Checks the credentials and starts a session. The order matters (DD-AUTH-01):
 * rate limit first, then one generic error for unknown email and wrong password (BR-AUTH-03).
 */
export async function login(
  { email, password }: LoginRequest,
  previousToken: string | undefined,
): Promise<{ user: AuthUser; token: string }> {
  if (loginRateLimiter.isBlocked(email)) {
    throw new RateLimitedError('MSG-AUTH-02');
  }

  const found = await prisma.user.findUnique({ where: { email } });
  const ok = await verifyPassword(found?.passwordHash ?? null, password);
  if (!found || !ok) {
    loginRateLimiter.recordFailure(email);
    throw new UnauthenticatedError('MSG-AUTH-01');
  }

  loginRateLimiter.clear(email);
  // A new session on every login; the one the browser came with is dropped (session fixation).
  if (previousToken) await deleteSession(previousToken);
  const token = await createSession(found.id);
  const user: AuthUser = {
    id: found.id,
    email: found.email,
    name: found.name,
    globalRole: found.globalRole,
  };
  return { user, token };
}

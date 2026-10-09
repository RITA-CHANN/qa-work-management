import { type AuthUser, type ChangePassword, type LoginRequest } from '@qawm/shared';
import { env } from '../../config/env';
import {
  ForbiddenError,
  RateLimitedError,
  UnauthenticatedError,
  ValidationError,
} from '../../lib/errors';
import { prisma } from '../../lib/prisma';
import { recordAudit } from '../audit/record-audit';
import { hashPassword, verifyPassword } from './password';
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
  ip: string | null = null,
): Promise<{ user: AuthUser; token: string }> {
  if (loginRateLimiter.isBlocked(email)) {
    throw new RateLimitedError('MSG-AUTH-02');
  }

  const found = await prisma.user.findUnique({ where: { email } });
  const ok = await verifyPassword(found?.passwordHash ?? null, password);
  if (!found || !ok) {
    loginRateLimiter.recordFailure(email);
    // The email tried is kept, never the password (BR-ADMIN-14).
    await recordAudit(prisma, {
      actorId: found?.id ?? null,
      action: 'auth.sign_in_failed',
      targetType: 'session',
      targetName: email,
      ip,
    });
    throw new UnauthenticatedError('MSG-AUTH-01');
  }
  // Checked after the password, so the message doesn't reveal which emails exist (BR-ADMIN-10).
  if (found.status === 'DEACTIVATED') {
    await recordAudit(prisma, {
      actorId: found.id,
      action: 'auth.sign_in_failed',
      targetType: 'session',
      targetName: email,
      after: { reason: 'deactivated' },
      ip,
    });
    throw new ForbiddenError('ACCOUNT_DEACTIVATED', 'MSG-ADMIN-06');
  }

  loginRateLimiter.clear(email);
  // A new session on every login; the one the browser came with is dropped (session fixation).
  if (previousToken) await deleteSession(previousToken);
  const token = await createSession(found.id);
  await prisma.user.update({ where: { id: found.id }, data: { lastSignInAt: new Date() } });
  await recordAudit(prisma, {
    actorId: found.id,
    action: 'auth.sign_in',
    targetType: 'session',
    targetName: found.email,
    ip,
  });
  const user: AuthUser = {
    id: found.id,
    email: found.email,
    name: found.name,
    globalRole: found.globalRole,
    mustChangePassword: found.mustChangePassword,
  };
  return { user, token };
}

/**
 * Replaces a one-time password (BR-ADMIN-07): the new one must differ from it. Other sessions end,
 * this one stays.
 */
export async function changePassword(
  user: AuthUser,
  sessionIdHash: string,
  { newPassword }: ChangePassword,
  ip: string | null,
): Promise<AuthUser> {
  const found = await prisma.user.findUniqueOrThrow({ where: { id: user.id } });
  if (await verifyPassword(found.passwordHash, newPassword)) {
    throw ValidationError.field('/newPassword', 'MSG-ADMIN-14');
  }
  const passwordHash = await hashPassword(newPassword);
  await prisma.$transaction(async (tx) => {
    await tx.user.update({
      where: { id: user.id },
      data: { passwordHash, mustChangePassword: false },
    });
    await tx.session.deleteMany({ where: { userId: user.id, idHash: { not: sessionIdHash } } });
    await recordAudit(tx, {
      actorId: user.id,
      action: 'auth.password_changed',
      targetType: 'user',
      targetId: user.id,
      targetName: user.email,
      ip,
    });
  });
  return { ...user, mustChangePassword: false };
}

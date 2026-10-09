import { createHash, randomBytes } from 'node:crypto';
import type { CookieOptions } from 'express';
import type { AuthUser } from '@qawm/shared';
import { env } from '../../config/env';
import { prisma } from '../../lib/prisma';

export const SESSION_COOKIE = 'qawm_sid';

const ttlMs = () => env.SESSION_TTL_HOURS * 60 * 60 * 1000;

/** HttpOnly so page scripts can't read it (BR-AUTH-15); SameSite=Lax against CSRF (DD-AUTH-02). */
export function sessionCookieOptions(): CookieOptions {
  return {
    httpOnly: true,
    sameSite: 'lax',
    secure: env.NODE_ENV === 'production',
    path: '/',
    maxAge: ttlMs(),
  };
}

/** Only this hash is stored, so a database copy can't be used to log in. */
export function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

const userSelect = {
  id: true,
  email: true,
  name: true,
  globalRole: true,
  mustChangePassword: true,
} as const;

/** Creates a session and returns the raw token for the cookie. Expiry is fixed at login (BR-AUTH-05). */
export async function createSession(userId: string): Promise<string> {
  const token = randomBytes(32).toString('base64url');
  await prisma.session.create({
    data: { idHash: hashToken(token), userId, expiresAt: new Date(Date.now() + ttlMs()) },
  });
  return token;
}

/** The user for a token, or null if unknown or expired. Expired rows are deleted. */
export async function findSessionUser(
  token: string,
): Promise<{ user: AuthUser; idHash: string } | null> {
  const idHash = hashToken(token);
  const session = await prisma.session.findUnique({
    where: { idHash },
    select: { expiresAt: true, user: { select: userSelect } },
  });
  if (!session) return null;
  if (session.expiresAt <= new Date()) {
    await deleteSessionByHash(idHash);
    return null;
  }
  return { user: session.user, idHash };
}

/** Deletes one session only; the user's other browsers stay logged in (BR-AUTH-07). */
export async function deleteSessionByHash(idHash: string): Promise<void> {
  await prisma.session.deleteMany({ where: { idHash } });
}

export async function deleteSession(token: string): Promise<void> {
  await deleteSessionByHash(hashToken(token));
}

/** Ends every session of a user: deactivation, password reset, "Sign out everywhere" (BR-ADMIN-10, 12, 13). */
export async function deleteUserSessions(userId: string): Promise<number> {
  const { count } = await prisma.session.deleteMany({ where: { userId } });
  return count;
}

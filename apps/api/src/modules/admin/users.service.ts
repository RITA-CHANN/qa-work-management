import { randomBytes } from 'node:crypto';
import type {
  AdminUser,
  AdminUserDetail,
  AdminUserListQuery,
  AuthUser,
  GlobalRole,
  OneTimePassword,
} from '@qawm/shared';
import type { adminUserCreateSchema } from '@qawm/shared';
import type { z } from 'zod';
import type { Prisma } from '../../generated/prisma/client';
import { isUniqueViolation, type Tx } from '../../lib/db-types';
import { ConflictError, NotFoundError, UnprocessableError } from '../../lib/errors';
import { prisma } from '../../lib/prisma';
import { recordAudit } from '../audit/record-audit';
import { hashPassword } from '../auth/password';

const userInclude = {
  _count: { select: { memberships: true } },
} satisfies Prisma.UserInclude;

type UserRow = Prisma.UserGetPayload<{ include: typeof userInclude }>;

function toAdminUser(row: UserRow): AdminUser {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    globalRole: row.globalRole,
    status: row.status,
    mustChangePassword: row.mustChangePassword,
    projectCount: row._count.memberships,
    lastSignInAt: row.lastSignInAt?.toISOString() ?? null,
    createdAt: row.createdAt.toISOString(),
  };
}

/** 16 random characters from an alphabet without look-alikes (0/O, 1/l). Shown once (MSG-ADMIN-02). */
export function generateOneTimePassword(): string {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
  const bytes = randomBytes(16);
  return Array.from(bytes, (byte) => alphabet[byte % alphabet.length]).join('');
}

/** BR-ADMIN-06: every account, filtered by search, role and status. */
export async function listUsers(query: AdminUserListQuery): Promise<AdminUser[]> {
  const rows = await prisma.user.findMany({
    where: {
      ...(query.role ? { globalRole: query.role } : {}),
      ...(query.status ? { status: query.status } : {}),
      ...(query.search
        ? {
            OR: [
              { name: { contains: query.search, mode: 'insensitive' } },
              { email: { contains: query.search, mode: 'insensitive' } },
            ],
          }
        : {}),
    },
    include: userInclude,
    orderBy: [{ name: 'asc' }, { email: 'asc' }],
  });
  return rows.map(toAdminUser);
}

export async function getUser(id: string): Promise<AdminUserDetail> {
  const row = await prisma.user.findUnique({
    where: { id },
    include: {
      ...userInclude,
      memberships: {
        include: { project: { select: { key: true, name: true, archivedAt: true } } },
        orderBy: { project: { name: 'asc' } },
      },
      _count: {
        select: { memberships: true, sessions: { where: { expiresAt: { gt: new Date() } } } },
      },
    },
  });
  if (!row) throw new NotFoundError('MSG-ADMIN-16');
  return {
    ...toAdminUser(row),
    projects: row.memberships.map((m) => ({
      key: m.project.key,
      name: m.project.name,
      access: m.access,
      jobTitle: m.jobTitle,
      archived: !!m.project.archivedAt,
    })),
    activeSessions: row._count.sessions,
  };
}

async function findOrThrow(db: Tx, id: string) {
  const row = await db.user.findUnique({ where: { id }, include: userInclude });
  if (!row) throw new NotFoundError('MSG-ADMIN-16');
  return row;
}

/** BR-ADMIN-09: an Admin can't change their own role or status. */
function assertNotSelf(admin: AuthUser, targetId: string) {
  if (admin.id === targetId) throw new UnprocessableError('OWN_ACCOUNT', 'MSG-ADMIN-04');
}

/**
 * BR-ADMIN-09: at least one active Admin stays. Run inside the transaction, before the change. The Admin
 * rows are locked first, so two Admins demoting each other at the same time can't both pass (AC-ADMIN-21).
 */
async function assertAnotherActiveAdmin(tx: Tx, targetId: string) {
  await tx.$queryRaw`SELECT id FROM users WHERE global_role = 'ADMIN' ORDER BY id FOR UPDATE`;
  const others = await tx.user.count({
    where: { globalRole: 'ADMIN', status: 'ACTIVE', id: { not: targetId } },
  });
  if (others === 0) throw new UnprocessableError('LAST_ADMIN', 'MSG-ADMIN-03');
}

/** BR-ADMIN-07: a new account with a one-time password the user must replace at first sign-in. */
export async function createUser(
  admin: AuthUser,
  body: z.output<typeof adminUserCreateSchema>,
  ip: string | null,
): Promise<OneTimePassword> {
  const oneTimePassword = generateOneTimePassword();
  const passwordHash = await hashPassword(oneTimePassword);
  try {
    const user = await prisma.$transaction(async (tx) => {
      const row = await tx.user.create({
        data: { ...body, passwordHash, mustChangePassword: true },
        include: userInclude,
      });
      await recordAudit(tx, {
        actorId: admin.id,
        action: 'user.created',
        targetType: 'user',
        targetId: row.id,
        targetName: row.email,
        after: { name: row.name, email: row.email, globalRole: row.globalRole },
        ip,
      });
      return row;
    });
    return { user: toAdminUser(user), oneTimePassword };
  } catch (error) {
    if (isUniqueViolation(error)) throw new ConflictError('EMAIL_TAKEN', 'MSG-ADMIN-01');
    throw error;
  }
}

/** BR-ADMIN-08: takes effect on the user's next request (requireAuth reads the role fresh). */
export async function changeGlobalRole(
  admin: AuthUser,
  id: string,
  globalRole: GlobalRole,
  ip: string | null,
): Promise<AdminUser> {
  assertNotSelf(admin, id);
  return prisma.$transaction(async (tx) => {
    const before = await findOrThrow(tx, id);
    if (before.globalRole === globalRole) return toAdminUser(before);
    if (before.globalRole === 'ADMIN' && before.status === 'ACTIVE') {
      await assertAnotherActiveAdmin(tx, id);
    }
    const row = await tx.user.update({ where: { id }, data: { globalRole }, include: userInclude });
    await recordAudit(tx, {
      actorId: admin.id,
      action: 'user.role_changed',
      targetType: 'user',
      targetId: id,
      targetName: row.email,
      before: { globalRole: before.globalRole },
      after: { globalRole },
      ip,
    });
    return toAdminUser(row);
  });
}

/** BR-ADMIN-10, BR-ADMIN-11: blocks sign-in and ends every session at once. */
export async function deactivateUser(
  admin: AuthUser,
  id: string,
  ip: string | null,
): Promise<AdminUser> {
  assertNotSelf(admin, id);
  return prisma.$transaction(async (tx) => {
    const before = await findOrThrow(tx, id);
    if (before.status === 'DEACTIVATED') return toAdminUser(before);
    if (before.globalRole === 'ADMIN') await assertAnotherActiveAdmin(tx, id);

    // Active projects where this user is the only Project admin (BR-ADMIN-11).
    const sole = await tx.project.findMany({
      where: {
        archivedAt: null,
        members: { some: { userId: id, access: 'PROJECT_ADMIN' } },
        NOT: {
          members: {
            some: {
              userId: { not: id },
              access: 'PROJECT_ADMIN',
              user: { status: 'ACTIVE' },
            },
          },
        },
      },
      select: { key: true },
      orderBy: { key: 'asc' },
    });
    if (sole.length > 0) {
      throw new UnprocessableError('LAST_PROJECT_ADMIN', 'MSG-ADMIN-05', {
        name: before.name,
        projects: sole.map((p) => p.key).join(', '),
      });
    }

    const row = await tx.user.update({
      where: { id },
      data: { status: 'DEACTIVATED' },
      include: userInclude,
    });
    await tx.session.deleteMany({ where: { userId: id } });
    await recordAudit(tx, {
      actorId: admin.id,
      action: 'user.deactivated',
      targetType: 'user',
      targetId: id,
      targetName: row.email,
      before: { status: 'ACTIVE' },
      after: { status: 'DEACTIVATED' },
      ip,
    });
    return toAdminUser(row);
  });
}

export async function reactivateUser(
  admin: AuthUser,
  id: string,
  ip: string | null,
): Promise<AdminUser> {
  assertNotSelf(admin, id);
  return prisma.$transaction(async (tx) => {
    const before = await findOrThrow(tx, id);
    if (before.status === 'ACTIVE') return toAdminUser(before);
    const row = await tx.user.update({
      where: { id },
      data: { status: 'ACTIVE' },
      include: userInclude,
    });
    await recordAudit(tx, {
      actorId: admin.id,
      action: 'user.reactivated',
      targetType: 'user',
      targetId: id,
      targetName: row.email,
      before: { status: 'DEACTIVATED' },
      after: { status: 'ACTIVE' },
      ip,
    });
    return toAdminUser(row);
  });
}

/** BR-ADMIN-12: new one-time password, every session ends, change forced at next sign-in. */
export async function resetPassword(
  admin: AuthUser,
  id: string,
  ip: string | null,
): Promise<OneTimePassword> {
  // An Admin changes their own password the normal way, not with a one-time password.
  assertNotSelf(admin, id);
  const oneTimePassword = generateOneTimePassword();
  const passwordHash = await hashPassword(oneTimePassword);
  const user = await prisma.$transaction(async (tx) => {
    await findOrThrow(tx, id);
    const row = await tx.user.update({
      where: { id },
      data: { passwordHash, mustChangePassword: true },
      include: userInclude,
    });
    await tx.session.deleteMany({ where: { userId: id } });
    await recordAudit(tx, {
      actorId: admin.id,
      action: 'user.password_reset',
      targetType: 'user',
      targetId: id,
      targetName: row.email,
      ip,
    });
    return row;
  });
  return { user: toAdminUser(user), oneTimePassword };
}

/** BR-ADMIN-13 */
export async function signOutEverywhere(
  admin: AuthUser,
  id: string,
  ip: string | null,
): Promise<{ endedSessions: number }> {
  assertNotSelf(admin, id);
  return prisma.$transaction(async (tx) => {
    const row = await findOrThrow(tx, id);
    const { count } = await tx.session.deleteMany({ where: { userId: id } });
    await recordAudit(tx, {
      actorId: admin.id,
      action: 'user.signed_out_everywhere',
      targetType: 'user',
      targetId: id,
      targetName: row.email,
      after: { endedSessions: count },
      ip,
    });
    return { endedSessions: count };
  });
}

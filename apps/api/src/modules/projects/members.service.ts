import { PROJECT_ROLES, type Member, type MemberAdd, type ProjectRole } from '@qawm/shared';
import type { Tx } from '../../lib/db-types';
import { isUniqueViolation } from '../../lib/db-types';
import { ConflictError, NotFoundError, UnprocessableError } from '../../lib/errors';
import { prisma } from '../../lib/prisma';
import { recordActivity } from '../activity/record-activity';
import { summaries } from '../activity/summaries';
import type { ProjectContext } from './loader';
import { lockActiveProject } from './lock';
import { assertCan, assertNotArchived } from './permissions';

type MemberRow = {
  role: ProjectRole;
  createdAt: Date;
  user: { id: string; name: string; email: string };
};

const memberInclude = { user: { select: { id: true, name: true, email: true } } } as const;

function toMember(row: MemberRow): Member {
  return {
    userId: row.user.id,
    name: row.user.name,
    email: row.user.email,
    role: row.role,
    addedAt: row.createdAt.toISOString(),
  };
}

/** API-PROJECT-08: Owners first (role order), then by name. */
export async function listMembers(ctx: ProjectContext): Promise<Member[]> {
  const rows = await prisma.projectMember.findMany({
    where: { projectId: ctx.project.id },
    include: memberInclude,
  });
  return rows
    .sort(
      (a, b) =>
        PROJECT_ROLES.indexOf(a.role) - PROJECT_ROLES.indexOf(b.role) ||
        a.user.name.localeCompare(b.user.name),
    )
    .map(toMember);
}

async function findMember(tx: Tx, projectId: string, userId: string) {
  const row = await tx.projectMember.findUnique({
    where: { projectId_userId: { projectId, userId } },
    include: memberInclude,
  });
  if (!row) throw new NotFoundError();
  return row;
}

/** BR-PROJECT-12: checked after the change, inside its transaction, so a refused change is rolled back. */
async function assertOwnerRemains(tx: Tx, projectId: string): Promise<void> {
  const owners = await tx.projectMember.count({ where: { projectId, role: 'OWNER' } });
  if (owners === 0) throw new UnprocessableError('LAST_OWNER', 'MSG-PROJECT-12');
}

/** API-PROJECT-09. Only an Owner (or Admin) may add an Owner (BR-PROJECT-23). */
export async function addMember(ctx: ProjectContext, body: MemberAdd): Promise<Member> {
  const { project, user } = ctx;
  assertCan(ctx.role, 'member:manage');
  if (body.role === 'OWNER') assertCan(ctx.role, 'member:manage-owner');
  assertNotArchived(project);

  const newMember = await prisma.user.findUnique({ where: { id: body.userId } });
  if (!newMember) throw new NotFoundError(); // BR-PROJECT-11: existing users only
  const alreadyMember = () =>
    new ConflictError('ALREADY_MEMBER', 'MSG-PROJECT-11', { name: newMember.name });

  try {
    return await prisma.$transaction(async (tx) => {
      await lockActiveProject(tx, project.id);
      const existing = await tx.projectMember.findUnique({
        where: { projectId_userId: { projectId: project.id, userId: body.userId } },
      });
      if (existing) throw alreadyMember(); // BR-PROJECT-10
      const row = await tx.projectMember.create({
        data: { projectId: project.id, userId: body.userId, role: body.role },
        include: memberInclude,
      });
      await recordActivity(tx, {
        projectId: project.id,
        actorId: user.id,
        action: 'member.added',
        entityType: 'member',
        entityId: body.userId,
        summary: summaries.memberAdded(user.name, newMember.name, body.role),
      });
      return toMember(row);
    });
  } catch (error) {
    if (isUniqueViolation(error)) throw alreadyMember();
    throw error;
  }
}

/**
 * API-PROJECT-10. Owner roles need an Owner (BR-PROJECT-23); nobody changes their own role except an
 * Owner stepping down while another Owner remains (BR-PROJECT-24); a project keeps an Owner (BR-PROJECT-12).
 */
export async function changeMemberRole(
  ctx: ProjectContext,
  userId: string,
  role: ProjectRole,
): Promise<Member> {
  const { project, user } = ctx;
  assertCan(ctx.role, 'member:manage');
  assertNotArchived(project);

  return prisma.$transaction(async (tx) => {
    await lockActiveProject(tx, project.id);
    const target = await findMember(tx, project.id, userId);
    if (target.role === 'OWNER' || role === 'OWNER') assertCan(ctx.role, 'member:manage-owner');
    // Same role again: nothing to do, no activity entry (idempotent).
    if (target.role === role) return toMember(target);
    const steppingDown = target.role === 'OWNER' && role !== 'OWNER';
    if (userId === user.id && !steppingDown) {
      throw new UnprocessableError('OWN_ROLE', 'MSG-PROJECT-22');
    }

    const row = await tx.projectMember.update({
      where: { projectId_userId: { projectId: project.id, userId } },
      data: { role },
      include: memberInclude,
    });
    await assertOwnerRemains(tx, project.id);
    await recordActivity(tx, {
      projectId: project.id,
      actorId: user.id,
      action: 'member.role_changed',
      entityType: 'member',
      entityId: userId,
      summary: summaries.memberRoleChanged(user.name, target.user.name, target.role, role),
      changes: { role: { from: target.role, to: role } },
    });
    return toMember(row);
  });
}

/**
 * API-PROJECT-11. Removing someone else needs member:manage (and member:manage-owner for an Owner);
 * leaving needs nothing but membership. Either way an Owner must remain (BR-PROJECT-12).
 */
export async function removeMember(ctx: ProjectContext, userId: string): Promise<void> {
  const { project, user } = ctx;
  const leaving = userId === user.id;
  if (!leaving) assertCan(ctx.role, 'member:manage');
  assertNotArchived(project);

  await prisma.$transaction(async (tx) => {
    await lockActiveProject(tx, project.id);
    const target = await findMember(tx, project.id, userId);
    if (!leaving && target.role === 'OWNER') assertCan(ctx.role, 'member:manage-owner');

    await tx.projectMember.delete({
      where: { projectId_userId: { projectId: project.id, userId } },
    });
    await assertOwnerRemains(tx, project.id);
    await recordActivity(tx, {
      projectId: project.id,
      actorId: user.id,
      action: leaving ? 'member.left' : 'member.removed',
      entityType: 'member',
      entityId: userId,
      summary: leaving
        ? summaries.memberLeft(user.name)
        : summaries.memberRemoved(user.name, target.user.name),
    });
  });
}

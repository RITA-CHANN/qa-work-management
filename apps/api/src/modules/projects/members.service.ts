import {
  PROJECT_ACCESS,
  type JobTitle,
  type Member,
  type MemberAdd,
  type MemberUpdate,
  type ProjectAccess,
} from '@qawm/shared';
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
  access: ProjectAccess;
  jobTitle: JobTitle | null;
  createdAt: Date;
  user: { id: string; name: string; email: string };
};

const memberInclude = { user: { select: { id: true, name: true, email: true } } } as const;

function toMember(row: MemberRow): Member {
  return {
    userId: row.user.id,
    name: row.user.name,
    email: row.user.email,
    access: row.access,
    jobTitle: row.jobTitle,
    addedAt: row.createdAt.toISOString(),
  };
}

/**
 * API-PROJECT-08: Project admins first, then by name. A Guest sees people by name only and never other Guests
 * (BR-GUEST-04).
 */
export async function listMembers(ctx: ProjectContext): Promise<Member[]> {
  const isGuest = ctx.access === 'GUEST';
  const rows = await prisma.projectMember.findMany({
    where: {
      projectId: ctx.project.id,
      ...(isGuest ? { OR: [{ access: { not: 'GUEST' } }, { userId: ctx.user.id }] } : {}),
    },
    include: memberInclude,
  });
  const members = rows
    .sort(
      (a, b) =>
        PROJECT_ACCESS.indexOf(a.access) - PROJECT_ACCESS.indexOf(b.access) ||
        a.user.name.localeCompare(b.user.name),
    )
    .map(toMember);
  return isGuest
    ? members.map((m) => ({ ...m, email: m.userId === ctx.user.id ? m.email : null }))
    : members;
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
async function assertProjectAdminRemains(tx: Tx, projectId: string): Promise<void> {
  const admins = await tx.projectMember.count({ where: { projectId, access: 'PROJECT_ADMIN' } });
  if (admins === 0) throw new UnprocessableError('LAST_PROJECT_ADMIN', 'MSG-PROJECT-12');
}

/** API-PROJECT-09: a Project admin adds any existing user, as Project admin, Member or Guest (BR-PROJECT-23). */
export async function addMember(ctx: ProjectContext, body: MemberAdd): Promise<Member> {
  const { project, user } = ctx;
  assertCan(ctx.access, 'member:manage');
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
        data: {
          projectId: project.id,
          userId: body.userId,
          access: body.access,
          jobTitle: body.jobTitle ?? null,
        },
        include: memberInclude,
      });
      await recordActivity(tx, {
        projectId: project.id,
        actorId: user.id,
        action: 'member.added',
        entityType: 'member',
        entityId: body.userId,
        summary: summaries.memberAdded(
          user.name,
          newMember.name,
          body.access,
          body.jobTitle ?? null,
        ),
      });
      return toMember(row);
    });
  } catch (error) {
    if (isUniqueViolation(error)) throw alreadyMember();
    throw error;
  }
}

/**
 * API-PROJECT-10: access level and job title. Nobody changes their own access level except a Project admin
 * stepping down to Member (BR-PROJECT-24); a project keeps a Project admin (BR-PROJECT-12).
 */
export async function updateMember(
  ctx: ProjectContext,
  userId: string,
  body: MemberUpdate,
): Promise<Member> {
  const { project, user } = ctx;
  assertCan(ctx.access, 'member:manage');
  assertNotArchived(project);

  return prisma.$transaction(async (tx) => {
    await lockActiveProject(tx, project.id);
    const target = await findMember(tx, project.id, userId);
    const access =
      body.access !== undefined && body.access !== target.access
        ? { from: target.access, to: body.access }
        : undefined;
    const jobTitle =
      body.jobTitle !== undefined && body.jobTitle !== target.jobTitle
        ? { from: target.jobTitle, to: body.jobTitle }
        : undefined;
    // Nothing changes: no write, no activity entry (idempotent).
    if (!access && !jobTitle) return toMember(target);
    const steppingDown = access?.from === 'PROJECT_ADMIN';
    if (access && userId === user.id && !steppingDown) {
      throw new UnprocessableError('OWN_ACCESS', 'MSG-PROJECT-22');
    }

    const row = await tx.projectMember.update({
      where: { projectId_userId: { projectId: project.id, userId } },
      data: {
        ...(access ? { access: access.to } : {}),
        ...(jobTitle ? { jobTitle: jobTitle.to } : {}),
      },
      include: memberInclude,
    });
    await assertProjectAdminRemains(tx, project.id);
    await recordActivity(tx, {
      projectId: project.id,
      actorId: user.id,
      action: 'member.updated',
      entityType: 'member',
      entityId: userId,
      summary: summaries.memberUpdated(user.name, target.user.name, access, jobTitle),
      changes: { ...(access ? { access } : {}), ...(jobTitle ? { jobTitle } : {}) },
    });
    return toMember(row);
  });
}

/**
 * API-PROJECT-11. Removing someone else needs member:manage; leaving needs nothing but membership.
 * Either way a Project admin must remain (BR-PROJECT-12).
 */
export async function removeMember(ctx: ProjectContext, userId: string): Promise<void> {
  const { project, user } = ctx;
  const leaving = userId === user.id;
  if (!leaving) assertCan(ctx.access, 'member:manage');
  assertNotArchived(project);

  await prisma.$transaction(async (tx) => {
    await lockActiveProject(tx, project.id);
    const target = await findMember(tx, project.id, userId);

    await tx.projectMember.delete({
      where: { projectId_userId: { projectId: project.id, userId } },
    });
    await assertProjectAdminRemains(tx, project.id);
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

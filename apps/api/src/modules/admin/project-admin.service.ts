import type { AuthUser, ChangeProjectAdmin, Member } from '@qawm/shared';
import { ValidationError } from '../../lib/errors';
import { prisma } from '../../lib/prisma';
import { recordActivity } from '../activity/record-activity';
import { summaries } from '../activity/summaries';
import { loadProject } from '../projects/loader';
import { lockActiveProject } from '../projects/lock';
import { listMembers } from '../projects/members.service';
import { assertNotArchived } from '../projects/permissions';

/**
 * API-ADMIN-12: a System admin hands a project to someone (BR-ADMIN-04), for example when its only Project admin
 * left the company. The user becomes Project admin (added if needed, job title kept); with `demoteCurrent` the
 * other Project admins become Members in the same transaction. Each change is an activity and audit entry.
 */
export async function changeProjectAdmin(
  admin: AuthUser,
  key: string,
  body: ChangeProjectAdmin,
): Promise<Member[]> {
  const ctx = await loadProject(key, admin);
  const { project } = ctx;
  assertNotArchived(project);
  const target = await prisma.user.findUnique({ where: { id: body.userId } });
  if (!target || target.status !== 'ACTIVE') {
    throw ValidationError.field('/userId', 'MSG-ADMIN-17');
  }

  await prisma.$transaction(async (tx) => {
    await lockActiveProject(tx, project.id);
    const current = await tx.projectMember.findUnique({
      where: { projectId_userId: { projectId: project.id, userId: target.id } },
    });
    if (!current) {
      await tx.projectMember.create({
        data: { projectId: project.id, userId: target.id, access: 'PROJECT_ADMIN' },
      });
      await recordActivity(tx, {
        projectId: project.id,
        actorId: admin.id,
        action: 'member.added',
        entityType: 'member',
        entityId: target.id,
        summary: summaries.memberAdded(admin.name, target.name, 'PROJECT_ADMIN', null),
        audit: true,
      });
    } else if (current.access !== 'PROJECT_ADMIN') {
      await tx.projectMember.update({
        where: { projectId_userId: { projectId: project.id, userId: target.id } },
        data: { access: 'PROJECT_ADMIN' },
      });
      const access = { from: current.access, to: 'PROJECT_ADMIN' as const };
      await recordActivity(tx, {
        projectId: project.id,
        actorId: admin.id,
        action: 'member.updated',
        entityType: 'member',
        entityId: target.id,
        summary: summaries.memberUpdated(admin.name, target.name, access),
        changes: { access },
        audit: true,
      });
    }

    if (!body.demoteCurrent) return;
    const others = await tx.projectMember.findMany({
      where: { projectId: project.id, access: 'PROJECT_ADMIN', userId: { not: target.id } },
      include: { user: { select: { name: true } } },
    });
    for (const other of others) {
      await tx.projectMember.update({
        where: { projectId_userId: { projectId: project.id, userId: other.userId } },
        data: { access: 'MEMBER' },
      });
      const access = { from: 'PROJECT_ADMIN' as const, to: 'MEMBER' as const };
      await recordActivity(tx, {
        projectId: project.id,
        actorId: admin.id,
        action: 'member.updated',
        entityType: 'member',
        entityId: other.userId,
        summary: summaries.memberUpdated(admin.name, other.user.name, access),
        changes: { access },
        audit: true,
      });
    }
  });
  return listMembers(ctx);
}

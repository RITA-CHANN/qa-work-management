import type {
  AuthUser,
  Project as ProjectDto,
  ProjectSummary,
  projectCreateSchema,
  projectListQuerySchema,
  projectUpdateSchema,
} from '@qawm/shared';
import type { z } from 'zod';
import { isUniqueViolation } from '../../lib/db-types';
import {
  ConflictError,
  ForbiddenError,
  UnprocessableError,
  ValidationError,
} from '../../lib/errors';
import { prisma } from '../../lib/prisma';
import { diff, recordActivity } from '../activity/record-activity';
import { summaries } from '../activity/summaries';
import { readProjectView, type ProjectContext } from './loader';
import { assertCan, assertNotArchived } from './permissions';

export const versionConflict = () => new ConflictError('VERSION_CONFLICT', 'MSG-PROJECT-07');

/** API-PROJECT-01: the caller's projects, every project for a System admin (BR-PROJECT-06, BR-PROJECT-36). */
export async function listProjects(
  user: AuthUser,
  query: z.output<typeof projectListQuerySchema>,
): Promise<ProjectSummary[]> {
  const rows = await prisma.project.findMany({
    where: {
      ...(user.globalRole === 'ADMIN' ? {} : { members: { some: { userId: user.id } } }),
      ...(query.archived ? {} : { archivedAt: null }),
      ...(query.search
        ? {
            OR: [
              { key: { contains: query.search, mode: 'insensitive' } },
              { name: { contains: query.search, mode: 'insensitive' } },
            ],
          }
        : {}),
    },
    orderBy: [{ name: 'asc' }, { key: 'asc' }],
    include: {
      members: { where: { userId: user.id }, select: { access: true } },
      _count: { select: { members: true } },
      releases: { where: { status: 'ACTIVE' }, select: { id: true, name: true } },
    },
  });
  return rows.map((row) => ({
    key: row.key,
    name: row.name,
    archivedAt: row.archivedAt?.toISOString() ?? null,
    myAccess: row.members[0]?.access ?? null,
    memberCount: row._count.members,
    activeRelease: row.releases[0] ?? null,
    updatedAt: row.updatedAt.toISOString(),
  }));
}

/**
 * API-PROJECT-02: only a System admin creates projects (BR-PROJECT-01). The first Project admin is an existing
 * user they pick; the System admin is not added as a member. Key unique across all projects (BR-PROJECT-03).
 */
export async function createProject(
  user: AuthUser,
  body: z.output<typeof projectCreateSchema>,
): Promise<ProjectDto> {
  if (user.globalRole !== 'ADMIN') throw new ForbiddenError();
  const firstAdmin = await prisma.user.findUnique({ where: { id: body.firstAdminId } });
  if (!firstAdmin) throw ValidationError.field('/firstAdminId', 'MSG-PROJECT-33');

  try {
    return await prisma.$transaction(async (tx) => {
      const project = await tx.project.create({
        data: {
          key: body.key,
          name: body.name,
          description: body.description ?? null,
          createdById: user.id,
          members: { create: { userId: firstAdmin.id, access: 'PROJECT_ADMIN' } },
        },
      });
      await recordActivity(tx, {
        projectId: project.id,
        actorId: user.id,
        action: 'project.created',
        entityType: 'project',
        entityId: project.id,
        summary: summaries.projectCreated(user.name),
      });
      await recordActivity(tx, {
        projectId: project.id,
        actorId: user.id,
        action: 'member.added',
        entityType: 'member',
        entityId: firstAdmin.id,
        summary: summaries.memberAdded(user.name, firstAdmin.name, 'PROJECT_ADMIN', null),
      });
      return readProjectView(tx, project.id, firstAdmin.id === user.id ? 'PROJECT_ADMIN' : null);
    });
  } catch (error) {
    if (isUniqueViolation(error)) throw new ConflictError('KEY_TAKEN', 'MSG-PROJECT-04');
    throw error;
  }
}

/** API-PROJECT-04: name and description, with optimistic locking (BR-PROJECT-07, DD-PROJECT-03). */
export async function updateProject(
  ctx: ProjectContext,
  body: z.output<typeof projectUpdateSchema>,
): Promise<ProjectDto> {
  const { project, user } = ctx;
  assertCan(ctx.access, 'project:edit');
  assertNotArchived(project);
  if (body.version !== project.version) throw versionConflict();

  const changes = diff(
    { name: project.name, description: project.description },
    { name: body.name, description: body.description },
  );
  // Nothing changed: no write, no version bump, no activity entry.
  if (!changes) return readProjectView(prisma, project.id, ctx.myAccess);

  return prisma.$transaction(async (tx) => {
    const { count } = await tx.project.updateMany({
      where: { id: project.id, version: body.version, archivedAt: null },
      data: { name: body.name, description: body.description, version: { increment: 1 } },
    });
    if (count === 0) throw versionConflict();
    await recordActivity(tx, {
      projectId: project.id,
      actorId: user.id,
      action: 'project.updated',
      entityType: 'project',
      entityId: project.id,
      summary: summaries.projectUpdated(user.name),
      changes,
    });
    return readProjectView(tx, project.id, ctx.myAccess);
  });
}

/** API-PROJECT-05: Project admins only; a second archive is a 422 (BR-PROJECT-08). */
export async function archiveProject(ctx: ProjectContext): Promise<ProjectDto> {
  const { project, user } = ctx;
  assertCan(ctx.access, 'project:archive');
  assertNotArchived(project);
  return prisma.$transaction(async (tx) => {
    const { count } = await tx.project.updateMany({
      where: { id: project.id, archivedAt: null },
      data: { archivedAt: new Date(), version: { increment: 1 } },
    });
    // Archived by someone else a moment ago.
    if (count === 0) throw new UnprocessableError('PROJECT_ARCHIVED', 'MSG-PROJECT-08');
    await recordActivity(tx, {
      projectId: project.id,
      actorId: user.id,
      action: 'project.archived',
      entityType: 'project',
      entityId: project.id,
      summary: summaries.projectArchived(user.name),
    });
    return readProjectView(tx, project.id, ctx.myAccess);
  });
}

/** API-PROJECT-06: Project admins only; restoring an active project changes nothing (idempotent). */
export async function restoreProject(ctx: ProjectContext): Promise<ProjectDto> {
  const { project, user } = ctx;
  assertCan(ctx.access, 'project:archive');
  return prisma.$transaction(async (tx) => {
    const { count } = await tx.project.updateMany({
      where: { id: project.id, archivedAt: { not: null } },
      data: { archivedAt: null, version: { increment: 1 } },
    });
    if (count > 0) {
      await recordActivity(tx, {
        projectId: project.id,
        actorId: user.id,
        action: 'project.restored',
        entityType: 'project',
        entityId: project.id,
        summary: summaries.projectRestored(user.name),
      });
    }
    return readProjectView(tx, project.id, ctx.myAccess);
  });
}

/**
 * API-PROJECT-07: Project admins only, and only an archived project without releases (BR-PROJECT-09).
 * Members and activity entries go with it (cascade); no entry is written.
 */
export async function deleteProject(ctx: ProjectContext): Promise<void> {
  const { project } = ctx;
  assertCan(ctx.access, 'project:delete');
  await prisma.$transaction(async (tx) => {
    const releases = await tx.release.count({ where: { projectId: project.id } });
    if (!project.archivedAt || releases > 0) {
      throw new UnprocessableError('DELETE_NOT_ALLOWED', 'MSG-PROJECT-09');
    }
    await tx.project.delete({ where: { id: project.id } });
  });
}

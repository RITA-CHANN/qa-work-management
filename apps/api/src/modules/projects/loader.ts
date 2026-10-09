import type { Request } from 'express';
import {
  canSeeArea,
  type AuthUser,
  type GuestArea,
  type Project as ProjectDto,
  type ProjectAccess,
} from '@qawm/shared';
import type { Project } from '../../generated/prisma/client';
import { fromDbDate } from '../../lib/dates';
import { NotFoundError } from '../../lib/errors';
import { prisma } from '../../lib/prisma';

export type ProjectContext = {
  project: Project;
  /** The access permissions are checked with. A System admin always acts as PROJECT_ADMIN (BR-PROJECT-36). */
  access: ProjectAccess;
  /** The caller's own member access; null for a System admin who is not a member. */
  myAccess: ProjectAccess | null;
  user: AuthUser;
};

/** `:key` of the URL, also inside the nested routers (mergeParams). */
export const keyOf = (req: Request) => (req.params as { key: string }).key;

/**
 * The only way a route reads a project (DD-PROJECT-01, OWASP API1). The project and the caller's member
 * row come from one query, fresh on every request (BR-PROJECT-13). An unknown key and "not a member" throw
 * the same 404, so a non-member can't tell whether the project exists (BR-PROJECT-06, ADR-0008).
 */
export async function loadProject(key: string, user: AuthUser): Promise<ProjectContext> {
  const found = await prisma.project.findUnique({
    where: { key: key.toUpperCase() },
    include: { members: { where: { userId: user.id }, select: { access: true } } },
  });
  const myAccess = found?.members[0]?.access ?? null;
  const isAdmin = user.globalRole === 'ADMIN';
  if (!found || (!myAccess && !isAdmin)) throw new NotFoundError('MSG-PROJECT-06');

  const { members: _members, ...project } = found;
  return { project, myAccess, access: isAdmin ? 'PROJECT_ADMIN' : myAccess!, user };
}

/**
 * BR-GUEST-03: an area switched off for Guests is hidden from them entirely, so the API answers 404, the same as an
 * unknown project. Everyone else passes. Call it right after loadProject on every read of that area.
 */
export function assertArea(ctx: ProjectContext, area: GuestArea): void {
  if (!canSeeArea(ctx.access, ctx.project.guestAreas, area)) throw new NotFoundError();
}

/**
 * A project as the API returns it (API-PROJECT-03). Called only after loadProject, with the id it found.
 * Takes a transaction client too, so a write can return the row it just changed.
 */
export async function readProjectView(
  db: Pick<typeof prisma, 'project'>,
  projectId: string,
  myAccess: ProjectAccess | null,
): Promise<ProjectDto> {
  const row = await db.project.findUniqueOrThrow({
    where: { id: projectId },
    include: {
      createdBy: { select: { id: true, name: true } },
      _count: { select: { members: true } },
      releases: { where: { status: 'ACTIVE' }, select: { id: true, name: true } },
      milestones: { where: { status: 'ACTIVE' }, select: { id: true, name: true, endDate: true } },
    },
  });
  const milestone = row.milestones[0];
  return {
    key: row.key,
    name: row.name,
    description: row.description,
    archivedAt: row.archivedAt?.toISOString() ?? null,
    version: row.version,
    myAccess,
    guestAreas: row.guestAreas,
    memberCount: row._count.members,
    activeRelease: row.releases[0] ?? null,
    activeMilestone: milestone
      ? { id: milestone.id, name: milestone.name, endDate: fromDbDate(milestone.endDate) }
      : null,
    createdBy: row.createdBy,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

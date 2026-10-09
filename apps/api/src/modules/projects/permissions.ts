import { can, type ProjectAction, type ProjectAccess } from '@qawm/shared';
import type { Project } from '../../generated/prisma/client';
import { ForbiddenError, UnprocessableError } from '../../lib/errors';

export { PERMISSIONS } from '@qawm/shared';

/** 403 unless the access level may do the action (BR-PROJECT-35). The map lives in packages/shared/src/permissions.ts. */
export function assertCan(access: ProjectAccess, action: ProjectAction): void {
  if (!can(access, action)) throw new ForbiddenError();
}

/** 422 on any change to an archived project, for everyone (BR-PROJECT-08). Runs after assertCan. */
export function assertNotArchived(project: Pick<Project, 'archivedAt'>): void {
  if (project.archivedAt) throw new UnprocessableError('PROJECT_ARCHIVED', 'MSG-PROJECT-08');
}

import { can, type ProjectAction, type ProjectRole } from '@qawm/shared';
import type { Project } from '../../generated/prisma/client';
import { ForbiddenError, UnprocessableError } from '../../lib/errors';

export { PERMISSIONS } from '@qawm/shared';

/** 403 unless the role may do the action (BR-PROJECT-35). The map lives in packages/shared/src/permissions.ts. */
export function assertCan(role: ProjectRole, action: ProjectAction): void {
  if (!can(role, action)) throw new ForbiddenError();
}

/** 422 on any change to an archived project, for every role (BR-PROJECT-08). Runs after assertCan. */
export function assertNotArchived(project: Pick<Project, 'archivedAt'>): void {
  if (project.archivedAt) throw new UnprocessableError('PROJECT_ARCHIVED', 'MSG-PROJECT-08');
}

import { can, type Project, type ProjectAction, type ProjectAccess } from '@qawm/shared';
import { useMe } from '@/features/auth/use-me';

/**
 * What the current user may do in this project, to show or hide buttons. The API checks the same map
 * on every request (DD-PROJECT-01), so hiding a button is a convenience, not the security.
 */
export function useProjectAccess(project: Project | undefined) {
  const { data: me } = useMe();
  // A System admin acts as Project admin on every project (BR-PROJECT-36).
  const access: ProjectAccess | null =
    me?.globalRole === 'ADMIN' ? 'PROJECT_ADMIN' : (project?.myAccess ?? null);
  const archived = !!project?.archivedAt;
  return {
    access,
    archived,
    me,
    /** Allowed for the access level and the project is not archived (BR-PROJECT-08). */
    can: (action: ProjectAction) => !archived && can(access, action),
    /** Allowed for the access level, whatever the archive state (archive, restore, delete). */
    canEvenArchived: (action: ProjectAction) => can(access, action),
  };
}

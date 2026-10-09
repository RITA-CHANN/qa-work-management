import { can, type Project, type ProjectAction, type ProjectRole } from '@qawm/shared';
import { useMe } from '@/features/auth/use-me';

/**
 * What the current user may do in this project, to show or hide buttons. The API checks the same map
 * on every request (DD-PROJECT-01), so hiding a button is a convenience, not the security.
 */
export function useProjectAccess(project: Project | undefined) {
  const { data: me } = useMe();
  // An Admin acts as Owner on every project (BR-PROJECT-36).
  const role: ProjectRole | null = me?.globalRole === 'ADMIN' ? 'OWNER' : (project?.myRole ?? null);
  const archived = !!project?.archivedAt;
  return {
    role,
    archived,
    me,
    /** Allowed for the role and the project is not archived (BR-PROJECT-08). */
    can: (action: ProjectAction) => !archived && can(role, action),
    /** Allowed for the role, whatever the archive state (archive, restore, delete). */
    canEvenArchived: (action: ProjectAction) => can(role, action),
  };
}

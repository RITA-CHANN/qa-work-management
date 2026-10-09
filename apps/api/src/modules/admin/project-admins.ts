import type { ProjectRole } from '@qawm/shared';

/**
 * Member roles that count as "Project admin" (ROLE-MODEL.md). Phase 3A still has 8 roles, where the
 * Owner is the one who runs the project; this list is the single place to change when the access
 * levels land.
 */
export const PROJECT_ADMIN_ROLES: ProjectRole[] = ['OWNER'];

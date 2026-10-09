import type { ProjectRole } from './projects';

/**
 * Which project role may do which action: the permission matrix of docs/requirements/project/README.md
 * (BR-PROJECT-35) as data. The API checks it on every write (assertCan); the web app uses it only to hide
 * buttons. `npm run docs:check` fails if this map and the README matrix disagree.
 *
 * Keep each list on one line: docs:check reads this file as text.
 */
// prettier-ignore
export const PERMISSIONS = {
  'project:view': ['OWNER', 'PROJECT_MANAGER', 'QA_LEAD', 'QA_ENGINEER', 'TEAM_LEAD', 'DEVELOPER', 'STAKEHOLDER', 'VIEWER'],
  'project:edit': ['OWNER', 'PROJECT_MANAGER', 'QA_LEAD'],
  'release:write': ['OWNER', 'PROJECT_MANAGER', 'QA_LEAD'],
  'milestone:write': ['OWNER', 'PROJECT_MANAGER', 'QA_LEAD', 'TEAM_LEAD'],
  'member:manage': ['OWNER', 'PROJECT_MANAGER', 'QA_LEAD'],
  'member:manage-owner': ['OWNER'],
  'project:archive': ['OWNER'],
  'project:delete': ['OWNER'],
} as const satisfies Record<string, readonly ProjectRole[]>;

export type ProjectAction = keyof typeof PERMISSIONS;

/** True if the role may do the action. An Admin acts as OWNER (BR-PROJECT-36), so pass 'OWNER' for them. */
export function can(role: ProjectRole | null | undefined, action: ProjectAction): boolean {
  return !!role && (PERMISSIONS[action] as readonly ProjectRole[]).includes(role);
}

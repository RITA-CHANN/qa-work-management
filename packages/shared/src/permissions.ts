import type { ProjectAccess } from './projects';

/**
 * Which access level may do which action: the permission matrix of docs/requirements/project/README.md
 * (BR-PROJECT-35) as data. Job titles play no part. The API checks it on every write (assertCan); the web app uses it only to hide
 * buttons. `npm run docs:check` fails if this map and the README matrix disagree.
 *
 * Keep each list on one line: docs:check reads this file as text.
 */
// prettier-ignore
export const PERMISSIONS = {
  'project:view': ['PROJECT_ADMIN', 'MEMBER', 'GUEST'],
  'project:edit': ['PROJECT_ADMIN'],
  'project:guests': ['PROJECT_ADMIN'],
  'release:write': ['PROJECT_ADMIN'],
  'milestone:write': ['PROJECT_ADMIN'],
  'member:manage': ['PROJECT_ADMIN'],
  'project:archive': ['PROJECT_ADMIN'],
  'project:delete': ['PROJECT_ADMIN'],
} as const satisfies Record<string, readonly ProjectAccess[]>;

export type ProjectAction = keyof typeof PERMISSIONS;

/** True if the access level may do the action. A System admin acts as PROJECT_ADMIN (BR-PROJECT-36). */
export function can(access: ProjectAccess | null | undefined, action: ProjectAction): boolean {
  return !!access && (PERMISSIONS[action] as readonly ProjectAccess[]).includes(access);
}

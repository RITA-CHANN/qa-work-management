import { z } from 'zod';
import { msg } from './messages';

/**
 * Admin console (Phase 3C): users, all projects, audit log. Only System admins reach these endpoints;
 * for everyone else /api/admin/* does not exist (404, BR-ADMIN-01). Rules: docs/requirements/admin/rules.md.
 */

export const GLOBAL_ROLES = ['ADMIN', 'USER'] as const;
export const globalRoleSchema = z.enum(GLOBAL_ROLES);
export type GlobalRole = z.infer<typeof globalRoleSchema>;
export const GLOBAL_ROLE_LABELS: Record<GlobalRole, string> = { ADMIN: 'Admin', USER: 'User' };

export const USER_STATUSES = ['ACTIVE', 'DEACTIVATED'] as const;
export const userStatusSchema = z.enum(USER_STATUSES);
export type UserStatus = z.infer<typeof userStatusSchema>;
export const USER_STATUS_LABELS: Record<UserStatus, string> = {
  ACTIVE: 'Active',
  DEACTIVATED: 'Deactivated',
};

/** A user as the Admin console lists them (BR-ADMIN-06). */
export const adminUserSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.email(),
  globalRole: globalRoleSchema,
  status: userStatusSchema,
  mustChangePassword: z.boolean(),
  projectCount: z.number().int(),
  lastSignInAt: z.string().nullable(),
  createdAt: z.string(),
});
export type AdminUser = z.infer<typeof adminUserSchema>;

/** One project membership in the user detail panel. */
export const adminUserProjectSchema = z.object({
  key: z.string(),
  name: z.string(),
  role: z.string(),
  archived: z.boolean(),
});
export type AdminUserProject = z.infer<typeof adminUserProjectSchema>;

export const adminUserDetailSchema = adminUserSchema.extend({
  projects: z.array(adminUserProjectSchema),
  activeSessions: z.number().int(),
});
export type AdminUserDetail = z.infer<typeof adminUserDetailSchema>;

/** Query of GET /api/admin/users. */
export const adminUserListQuerySchema = z.strictObject({
  search: z.string().trim().min(1).max(100).optional(),
  role: globalRoleSchema.optional(),
  status: userStatusSchema.optional(),
});
export type AdminUserListQuery = z.infer<typeof adminUserListQuerySchema>;

/** BR-ADMIN-07: name 2–100 characters after trimming. */
export const userNameSchema = z
  .string({ error: msg('MSG-ADMIN-11') })
  .trim()
  .min(2, msg('MSG-ADMIN-11'))
  .max(100, msg('MSG-ADMIN-11'));

/** Body of POST /api/admin/users (BR-ADMIN-07). The email is trimmed and lower-cased (BR-AUTH-01). */
export const adminUserCreateSchema = z.strictObject({
  name: userNameSchema,
  email: z
    .string({ error: msg('MSG-AUTH-03') })
    .trim()
    .min(1, msg('MSG-AUTH-03'))
    .toLowerCase()
    .pipe(z.email(msg('MSG-AUTH-04'))),
  globalRole: globalRoleSchema.default('USER'),
});
export type AdminUserCreate = z.input<typeof adminUserCreateSchema>;

/** Body of PATCH /api/admin/users/:id (BR-ADMIN-08). */
export const adminUserUpdateSchema = z.strictObject({ globalRole: globalRoleSchema });
export type AdminUserUpdate = z.infer<typeof adminUserUpdateSchema>;

/** Returned once when an account is created or its password reset (MSG-ADMIN-02). */
export const oneTimePasswordSchema = z.object({
  user: adminUserSchema,
  oneTimePassword: z.string(),
});
export type OneTimePassword = z.infer<typeof oneTimePasswordSchema>;

/** A project row in the Admin console (BR-ADMIN-02, BR-ADMIN-03). */
export const adminProjectSchema = z.object({
  key: z.string(),
  name: z.string(),
  archived: z.boolean(),
  memberCount: z.number().int(),
  projectAdmins: z.array(z.object({ id: z.string(), name: z.string() })),
  activeRelease: z.object({ name: z.string(), targetDate: z.string().nullable() }).nullable(),
  activeMilestone: z.object({ name: z.string(), endDate: z.string() }).nullable(),
  lastActivityAt: z.string().nullable(),
  createdAt: z.string(),
});
export type AdminProject = z.infer<typeof adminProjectSchema>;

export const adminProjectListQuerySchema = z.strictObject({
  search: z.string().trim().min(1).max(100).optional(),
  status: z.enum(['active', 'archived', 'all']).default('all'),
});

/** KPIs of the all-projects dashboard (BR-ADMIN-02). */
export const adminOverviewSchema = z.object({
  activeProjects: z.number().int(),
  archivedProjects: z.number().int(),
  activeUsers: z.number().int(),
  totalUsers: z.number().int(),
  admins: z.number().int(),
  failedSignIns7d: z.number().int(),
  adminActions7d: z.number().int(),
  projects: z.array(adminProjectSchema),
});
export type AdminOverview = z.infer<typeof adminOverviewSchema>;

/** Audit actions (BR-ADMIN-14). `project.*` and `member.*` etc. come from Admin writes on projects. */
export const AUDIT_ACTION_LABELS: Record<string, string> = {
  'auth.sign_in': 'Signed in',
  'auth.sign_in_failed': 'Sign-in failed',
  'auth.sign_out': 'Signed out',
  'auth.password_changed': 'Changed password',
  'user.created': 'Created user',
  'user.role_changed': 'Changed global role',
  'user.deactivated': 'Deactivated user',
  'user.reactivated': 'Reactivated user',
  'user.password_reset': 'Reset password',
  'user.signed_out_everywhere': 'Signed user out everywhere',
  'project.created': 'Created project',
  'project.updated': 'Edited project',
  'project.archived': 'Archived project',
  'project.restored': 'Restored project',
  'project.deleted': 'Deleted project',
  'member.added': 'Added member',
  'member.role_changed': 'Changed member role',
  'member.removed': 'Removed member',
  'release.created': 'Created release',
  'release.updated': 'Edited release',
  'release.status_changed': 'Changed release status',
  'release.deleted': 'Deleted release',
  'milestone.created': 'Created sprint',
  'milestone.updated': 'Edited sprint',
  'milestone.status_changed': 'Changed sprint status',
  'milestone.deleted': 'Deleted sprint',
};

export const auditEventSchema = z.object({
  id: z.string(),
  at: z.string(),
  actor: z.object({ id: z.string(), name: z.string() }).nullable(),
  action: z.string(),
  actionLabel: z.string(),
  targetType: z.string(),
  targetName: z.string(),
  projectKey: z.string().nullable(),
  before: z.record(z.string(), z.unknown()).nullable(),
  after: z.record(z.string(), z.unknown()).nullable(),
  actedAs: z.string().nullable(),
  ip: z.string().nullable(),
});
export type AuditEvent = z.infer<typeof auditEventSchema>;

/** Query of GET /api/admin/audit (BR-ADMIN-15): 50 per page, newest first, cursor paging. */
export const auditQuerySchema = z.strictObject({
  actorId: z.string().optional(),
  action: z.string().max(60).optional(),
  projectKey: z.string().max(10).optional(),
  from: z.iso.date().optional(),
  to: z.iso.date().optional(),
  asAdmin: z
    .enum(['true', 'false'])
    .transform((value) => value === 'true')
    .optional(),
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(50),
});
export type AuditQuery = z.infer<typeof auditQuerySchema>;

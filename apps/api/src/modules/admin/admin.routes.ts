import { Router } from 'express';
import {
  adminProjectListQuerySchema,
  adminUserCreateSchema,
  adminUserListQuerySchema,
  adminUserUpdateSchema,
  auditQuerySchema,
  changeProjectAdminSchema,
  emptyBodySchema,
  workspaceSettingsSchema,
  type AdminOverview,
  type AdminProject,
  type AdminUser,
  type AdminUserDetail,
  type ApiCursorPage,
  type ApiSuccess,
  type AuditEvent,
  type Member,
  type OneTimePassword,
  type WorkspaceSettings,
} from '@qawm/shared';
import { parseOrThrow } from '../../lib/errors';
import { requireAuth } from '../../middleware/require-auth';
import { listAudit } from './audit.service';
import { adminOverview, listAdminProjects } from './overview.service';
import { changeProjectAdmin } from './project-admin.service';
import { requireAdmin } from './require-admin';
import { getSettings, updateSettings } from './settings.service';
import {
  changeGlobalRole,
  createUser,
  deactivateUser,
  getUser,
  listUsers,
  reactivateUser,
  resetPassword,
  signOutEverywhere,
} from './users.service';

/** /api/admin: the Admin console (Phase 3C). 404 for everyone but System admins (BR-ADMIN-01). */
export const adminRouter = Router();
adminRouter.use(requireAuth, requireAdmin);

const idOf = (params: unknown) => (params as { id: string }).id;

/** GET /api/admin/overview (API-ADMIN-01) */
adminRouter.get('/overview', async (_req, res) => {
  res.json({ data: await adminOverview() } satisfies ApiSuccess<AdminOverview>);
});

/** GET /api/admin/projects (API-ADMIN-02) */
adminRouter.get('/projects', async (req, res) => {
  const query = parseOrThrow(adminProjectListQuerySchema, req.query);
  res.json({ data: await listAdminProjects(query) } satisfies ApiSuccess<AdminProject[]>);
});

/** POST /api/admin/projects/:key/project-admin (API-ADMIN-12) */
adminRouter.post('/projects/:key/project-admin', async (req, res) => {
  const body = parseOrThrow(changeProjectAdminSchema, req.body);
  const key = (req.params as { key: string }).key;
  const members = await changeProjectAdmin(req.user!, key, body);
  res.json({ data: members } satisfies ApiSuccess<Member[]>);
});

/** GET /api/admin/users (API-ADMIN-03) */
adminRouter.get('/users', async (req, res) => {
  const query = parseOrThrow(adminUserListQuerySchema, req.query);
  res.json({ data: await listUsers(query) } satisfies ApiSuccess<AdminUser[]>);
});

/** POST /api/admin/users (API-ADMIN-04) */
adminRouter.post('/users', async (req, res) => {
  const body = parseOrThrow(adminUserCreateSchema, req.body);
  const created = await createUser(req.user!, body, req.ip ?? null);
  res.status(201).json({ data: created } satisfies ApiSuccess<OneTimePassword>);
});

/** GET /api/admin/users/:id (API-ADMIN-05) */
adminRouter.get('/users/:id', async (req, res) => {
  res.json({ data: await getUser(idOf(req.params)) } satisfies ApiSuccess<AdminUserDetail>);
});

/** PATCH /api/admin/users/:id (API-ADMIN-06): global role */
adminRouter.patch('/users/:id', async (req, res) => {
  const body = parseOrThrow(adminUserUpdateSchema, req.body);
  const user = await changeGlobalRole(req.user!, idOf(req.params), body.globalRole, req.ip ?? null);
  res.json({ data: user } satisfies ApiSuccess<AdminUser>);
});

/** POST /api/admin/users/:id/deactivate (API-ADMIN-07) */
adminRouter.post('/users/:id/deactivate', async (req, res) => {
  parseOrThrow(emptyBodySchema, req.body);
  const user = await deactivateUser(req.user!, idOf(req.params), req.ip ?? null);
  res.json({ data: user } satisfies ApiSuccess<AdminUser>);
});

/** POST /api/admin/users/:id/reactivate (API-ADMIN-08) */
adminRouter.post('/users/:id/reactivate', async (req, res) => {
  parseOrThrow(emptyBodySchema, req.body);
  const user = await reactivateUser(req.user!, idOf(req.params), req.ip ?? null);
  res.json({ data: user } satisfies ApiSuccess<AdminUser>);
});

/** POST /api/admin/users/:id/reset-password (API-ADMIN-09) */
adminRouter.post('/users/:id/reset-password', async (req, res) => {
  parseOrThrow(emptyBodySchema, req.body);
  const result = await resetPassword(req.user!, idOf(req.params), req.ip ?? null);
  res.json({ data: result } satisfies ApiSuccess<OneTimePassword>);
});

/** POST /api/admin/users/:id/sign-out (API-ADMIN-10): every session of the user */
adminRouter.post('/users/:id/sign-out', async (req, res) => {
  parseOrThrow(emptyBodySchema, req.body);
  const result = await signOutEverywhere(req.user!, idOf(req.params), req.ip ?? null);
  res.json({ data: result } satisfies ApiSuccess<{ endedSessions: number }>);
});

/** GET /api/admin/audit (API-ADMIN-11) */
adminRouter.get('/audit', async (req, res) => {
  const query = parseOrThrow(auditQuerySchema, req.query);
  const page = await listAudit(query);
  res.json({
    data: page.data,
    meta: { nextCursor: page.nextCursor },
  } satisfies ApiCursorPage<AuditEvent>);
});

/** GET /api/admin/settings (API-ADMIN-13) */
adminRouter.get('/settings', async (_req, res) => {
  res.json({ data: await getSettings() } satisfies ApiSuccess<WorkspaceSettings>);
});

/** PUT /api/admin/settings (API-ADMIN-14) */
adminRouter.put('/settings', async (req, res) => {
  const body = parseOrThrow(workspaceSettingsSchema, req.body);
  res.json({
    data: await updateSettings(req.user!.id, body, req.ip ?? null),
  } satisfies ApiSuccess<WorkspaceSettings>);
});

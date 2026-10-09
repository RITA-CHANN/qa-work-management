import { Router } from 'express';
import {
  activityQuerySchema,
  emptyBodySchema,
  memberAddSchema,
  memberUpdateSchema,
  projectCreateSchema,
  projectListQuerySchema,
  projectUpdateSchema,
  type ActivityEntry,
  type ApiCursorPage,
  type ApiSuccess,
  type Member,
  type Project,
  type ProjectSummary,
} from '@qawm/shared';
import { parseOrThrow } from '../../lib/errors';
import { prisma } from '../../lib/prisma';
import { requireAuth } from '../../middleware/require-auth';
import { listActivity } from '../activity/activity.service';
import { milestonesRouter } from '../milestones/milestones.routes';
import { releasesRouter } from '../releases/releases.routes';
import { keyOf, loadProject, readProjectView } from './loader';
import { addMember, listMembers, removeMember, updateMember } from './members.service';
import {
  archiveProject,
  createProject,
  deleteProject,
  listProjects,
  restoreProject,
  updateProject,
} from './projects.service';

/**
 * /api/projects and everything nested under a project. Every handler follows the same order
 * (DD-PROJECT-01): body/query schema (400) → loadProject (404) → service: permission (403) →
 * archived (422) → business rules (409/422).
 */
export const projectsRouter = Router();
projectsRouter.use(requireAuth);

/** GET /api/projects (API-PROJECT-01) */
projectsRouter.get('/', async (req, res) => {
  const query = parseOrThrow(projectListQuerySchema, req.query);
  const projects = await listProjects(req.user!, query);
  res.json({ data: projects } satisfies ApiSuccess<ProjectSummary[]>);
});

/** POST /api/projects (API-PROJECT-02) */
projectsRouter.post('/', async (req, res) => {
  const body = parseOrThrow(projectCreateSchema, req.body);
  const project = await createProject(req.user!, body);
  res
    .status(201)
    .location(`/api/projects/${project.key}`)
    .json({ data: project } satisfies ApiSuccess<Project>);
});

/** GET /api/projects/:key (API-PROJECT-03) */
projectsRouter.get('/:key', async (req, res) => {
  const ctx = await loadProject(keyOf(req), req.user!);
  const project = await readProjectView(prisma, ctx.project.id, ctx.myAccess);
  res.json({ data: project } satisfies ApiSuccess<Project>);
});

/** PATCH /api/projects/:key (API-PROJECT-04) */
projectsRouter.patch('/:key', async (req, res) => {
  const body = parseOrThrow(projectUpdateSchema, req.body);
  const ctx = await loadProject(keyOf(req), req.user!);
  res.json({ data: await updateProject(ctx, body) } satisfies ApiSuccess<Project>);
});

/** POST /api/projects/:key/archive (API-PROJECT-05) */
projectsRouter.post('/:key/archive', async (req, res) => {
  parseOrThrow(emptyBodySchema, req.body);
  const ctx = await loadProject(keyOf(req), req.user!);
  res.json({ data: await archiveProject(ctx) } satisfies ApiSuccess<Project>);
});

/** POST /api/projects/:key/restore (API-PROJECT-06) */
projectsRouter.post('/:key/restore', async (req, res) => {
  parseOrThrow(emptyBodySchema, req.body);
  const ctx = await loadProject(keyOf(req), req.user!);
  res.json({ data: await restoreProject(ctx) } satisfies ApiSuccess<Project>);
});

/** DELETE /api/projects/:key (API-PROJECT-07) */
projectsRouter.delete('/:key', async (req, res) => {
  const ctx = await loadProject(keyOf(req), req.user!);
  await deleteProject(ctx);
  res.status(204).end();
});

/** GET /api/projects/:key/members (API-PROJECT-08) */
projectsRouter.get('/:key/members', async (req, res) => {
  const ctx = await loadProject(keyOf(req), req.user!);
  res.json({ data: await listMembers(ctx) } satisfies ApiSuccess<Member[]>);
});

/** POST /api/projects/:key/members (API-PROJECT-09) */
projectsRouter.post('/:key/members', async (req, res) => {
  const body = parseOrThrow(memberAddSchema, req.body);
  const ctx = await loadProject(keyOf(req), req.user!);
  res.status(201).json({ data: await addMember(ctx, body) } satisfies ApiSuccess<Member>);
});

/** PATCH /api/projects/:key/members/:userId (API-PROJECT-10) */
projectsRouter.patch('/:key/members/:userId', async (req, res) => {
  const body = parseOrThrow(memberUpdateSchema, req.body);
  const ctx = await loadProject(keyOf(req), req.user!);
  const member = await updateMember(ctx, req.params.userId, body);
  res.json({ data: member } satisfies ApiSuccess<Member>);
});

/** DELETE /api/projects/:key/members/:userId (API-PROJECT-11): remove someone, or leave. */
projectsRouter.delete('/:key/members/:userId', async (req, res) => {
  const ctx = await loadProject(keyOf(req), req.user!);
  await removeMember(ctx, req.params.userId);
  res.status(204).end();
});

/** GET /api/projects/:key/activity (API-PROJECT-12). There is no write endpoint for activity. */
projectsRouter.get('/:key/activity', async (req, res) => {
  const query = parseOrThrow(activityQuerySchema, req.query);
  const ctx = await loadProject(keyOf(req), req.user!);
  const page = await listActivity(ctx, query);
  res.json({
    data: page.data,
    meta: { nextCursor: page.nextCursor },
  } satisfies ApiCursorPage<ActivityEntry>);
});

projectsRouter.use('/:key/releases', releasesRouter);
projectsRouter.use('/:key/milestones', milestonesRouter);

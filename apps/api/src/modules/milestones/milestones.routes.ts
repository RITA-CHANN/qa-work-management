import { Router } from 'express';
import {
  makeMilestoneCreateSchema,
  makeMilestoneUpdateSchema,
  milestoneListQuerySchema,
  type ApiSuccess,
  type Milestone,
} from '@qawm/shared';
import { env } from '../../config/env';
import { parseOrThrow } from '../../lib/errors';
import { keyOf, loadProject } from '../projects/loader';
import {
  createMilestone,
  deleteMilestone,
  listMilestones,
  updateMilestone,
} from './milestones.service';

// The longest sprint is a setting (BR-PROJECT-28), so the schemas are built with it.
const milestoneCreateSchema = makeMilestoneCreateSchema(env.MILESTONE_MAX_DAYS);
const milestoneUpdateSchema = makeMilestoneUpdateSchema(env.MILESTONE_MAX_DAYS);

/** /api/projects/:key/milestones. Mounted by projects.routes.ts, which already requires a session. */
export const milestonesRouter = Router({ mergeParams: true });

/** GET ?releaseId= (API-MILESTONE-01) */
milestonesRouter.get('/', async (req, res) => {
  const query = parseOrThrow(milestoneListQuerySchema, req.query);
  const ctx = await loadProject(keyOf(req), req.user!);
  const milestones = await listMilestones(ctx, query.releaseId);
  res.json({ data: milestones } satisfies ApiSuccess<Milestone[]>);
});

/** POST (API-MILESTONE-02) */
milestonesRouter.post('/', async (req, res) => {
  const body = parseOrThrow(milestoneCreateSchema, req.body);
  const ctx = await loadProject(keyOf(req), req.user!);
  const milestone = await createMilestone(ctx, body);
  res.status(201).json({ data: milestone } satisfies ApiSuccess<Milestone>);
});

/** PATCH /:id (API-MILESTONE-03) */
milestonesRouter.patch('/:id', async (req, res) => {
  const body = parseOrThrow(milestoneUpdateSchema, req.body);
  const ctx = await loadProject(keyOf(req), req.user!);
  const milestone = await updateMilestone(ctx, req.params.id, body);
  res.json({ data: milestone } satisfies ApiSuccess<Milestone>);
});

/** DELETE /:id (API-MILESTONE-04) */
milestonesRouter.delete('/:id', async (req, res) => {
  const ctx = await loadProject(keyOf(req), req.user!);
  await deleteMilestone(ctx, req.params.id);
  res.status(204).end();
});

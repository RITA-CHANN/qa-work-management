import { Router } from 'express';
import {
  releaseCreateSchema,
  releaseUpdateSchema,
  type ApiSuccess,
  type Release,
} from '@qawm/shared';
import { parseOrThrow } from '../../lib/errors';
import { assertArea, keyOf, loadProject } from '../projects/loader';
import { createRelease, deleteRelease, listReleases, updateRelease } from './releases.service';

/** /api/projects/:key/releases. Mounted by projects.routes.ts, which already requires a session. */
export const releasesRouter = Router({ mergeParams: true });

/** GET (API-RELEASE-01) */
releasesRouter.get('/', async (req, res) => {
  const ctx = await loadProject(keyOf(req), req.user!);
  assertArea(ctx, 'releases');
  res.json({ data: await listReleases(ctx) } satisfies ApiSuccess<Release[]>);
});

/** POST (API-RELEASE-02) */
releasesRouter.post('/', async (req, res) => {
  const body = parseOrThrow(releaseCreateSchema, req.body);
  const ctx = await loadProject(keyOf(req), req.user!);
  res.status(201).json({ data: await createRelease(ctx, body) } satisfies ApiSuccess<Release>);
});

/** PATCH /:id (API-RELEASE-03) */
releasesRouter.patch('/:id', async (req, res) => {
  const body = parseOrThrow(releaseUpdateSchema, req.body);
  const ctx = await loadProject(keyOf(req), req.user!);
  const release = await updateRelease(ctx, req.params.id, body);
  res.json({ data: release } satisfies ApiSuccess<Release>);
});

/** DELETE /:id (API-RELEASE-04) */
releasesRouter.delete('/:id', async (req, res) => {
  const ctx = await loadProject(keyOf(req), req.user!);
  await deleteRelease(ctx, req.params.id);
  res.status(204).end();
});

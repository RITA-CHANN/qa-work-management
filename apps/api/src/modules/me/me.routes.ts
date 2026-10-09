import { Router } from 'express';
import { z } from 'zod';
import { projectKeySchema, type ApiSuccess } from '@qawm/shared';
import { parseOrThrow } from '../../lib/errors';
import { prisma } from '../../lib/prisma';
import { requireAuth } from '../../middleware/require-auth';
import { loadProject } from '../projects/loader';

/** /api/me: the signed-in user's own settings. */
export const meRouter = Router();
meRouter.use(requireAuth);

type CurrentProject = { key: string | null };

const currentProjectBodySchema = z.strictObject({ key: projectKeySchema });

/**
 * GET /api/me/current-project (API-ME-01): the project the shell opens on (BR-SHELL-04). The last one
 * opened if the user can still see it and it is active, else the first active project they can see,
 * else null.
 */
meRouter.get('/current-project', async (req, res) => {
  const user = req.user!;
  const visible = user.globalRole === 'ADMIN' ? {} : { members: { some: { userId: user.id } } };
  const row = await prisma.user.findUnique({
    where: { id: user.id },
    select: { lastProject: { select: { id: true } } },
  });
  // Same visibility filter as the project list (API-PROJECT-01): active projects the user can see.
  const candidates = await prisma.project.findMany({
    where: { archivedAt: null, ...visible },
    orderBy: [{ name: 'asc' }, { key: 'asc' }],
    select: { id: true, key: true },
  });
  const last = candidates.find((p) => p.id === row?.lastProject?.id);
  const key = (last ?? candidates[0])?.key ?? null;
  res.json({ data: { key } } satisfies ApiSuccess<CurrentProject>);
});

/** PUT /api/me/current-project (API-ME-02): remember the project just opened. 404 if not visible. */
meRouter.put('/current-project', async (req, res) => {
  const body = parseOrThrow(currentProjectBodySchema, req.body);
  const { project } = await loadProject(body.key, req.user!);
  await prisma.user.update({ where: { id: req.user!.id }, data: { lastProjectId: project.id } });
  res.json({ data: { key: project.key } } satisfies ApiSuccess<CurrentProject>);
});

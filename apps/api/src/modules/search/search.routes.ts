import { Router } from 'express';
import {
  SEARCH_GROUP_LIMIT,
  searchQuerySchema,
  type ApiSuccess,
  type SearchResult,
} from '@qawm/shared';
import { parseOrThrow } from '../../lib/errors';
import { prisma } from '../../lib/prisma';
import { requireAuth } from '../../middleware/require-auth';

/** GET /api/search (API-SEARCH-01): the ⌘K palette (BR-SHELL-06). */
export const searchRouter = Router();
searchRouter.use(requireAuth);

searchRouter.get('/', async (req, res) => {
  const { q } = parseOrThrow(searchQuerySchema, req.query);
  const user = req.user!;
  const isAdmin = user.globalRole === 'ADMIN';
  // Same visibility as the API: members see their projects, Admins see all (BR-PROJECT-06).
  const visibleProject = isAdmin ? {} : { members: { some: { userId: user.id } } };
  const like = { contains: q, mode: 'insensitive' as const };
  const take = SEARCH_GROUP_LIMIT;

  const [projects, releases, milestones, users] = await Promise.all([
    prisma.project.findMany({
      where: { ...visibleProject, OR: [{ key: like }, { name: like }] },
      orderBy: [{ archivedAt: { sort: 'asc', nulls: 'first' } }, { name: 'asc' }],
      select: { key: true, name: true, archivedAt: true },
      take,
    }),
    prisma.release.findMany({
      where: { project: visibleProject, name: like },
      orderBy: [{ project: { key: 'asc' } }, { name: 'asc' }],
      select: { id: true, name: true, status: true, project: { select: { key: true } } },
      take,
    }),
    prisma.milestone.findMany({
      where: { project: visibleProject, name: like },
      orderBy: [{ project: { key: 'asc' } }, { name: 'asc' }],
      select: {
        id: true,
        name: true,
        status: true,
        release: { select: { name: true } },
        project: { select: { key: true } },
      },
      take,
    }),
    isAdmin
      ? prisma.user.findMany({
          where: { OR: [{ name: like }, { email: like }] },
          orderBy: { name: 'asc' },
          select: { id: true, name: true, email: true },
          take,
        })
      : Promise.resolve([]),
  ]);

  const status = (value: string) => value.charAt(0) + value.slice(1).toLowerCase();
  const results: SearchResult[] = [
    ...projects.map((p) => ({
      group: 'project' as const,
      id: p.key,
      title: p.name,
      subtitle: p.archivedAt ? `${p.key} · Archived` : p.key,
      href: `/projects/${p.key}`,
    })),
    ...releases.map((r) => ({
      group: 'release' as const,
      id: r.id,
      title: r.name,
      subtitle: `${r.project.key} · Release · ${status(r.status)}`,
      href: `/projects/${r.project.key}/releases`,
    })),
    ...milestones.map((m) => ({
      group: 'milestone' as const,
      id: m.id,
      title: m.name,
      subtitle: `${m.project.key} · ${m.release.name} · ${status(m.status)}`,
      href: `/projects/${m.project.key}/releases`,
    })),
    ...users.map((u) => ({
      group: 'user' as const,
      id: u.id,
      title: u.name,
      subtitle: u.email,
      href: `/admin/users?user=${u.id}`,
    })),
  ];
  res.json({ data: results } satisfies ApiSuccess<SearchResult[]>);
});

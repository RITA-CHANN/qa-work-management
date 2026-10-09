import type {
  ActivityActor,
  ActivityChanges,
  ActivityEntry,
  activityQuerySchema,
} from '@qawm/shared';
import type { z } from 'zod';
import { ValidationError } from '../../lib/errors';
import { prisma } from '../../lib/prisma';
import type { ProjectContext } from '../projects/loader';

/**
 * API-PROJECT-12: newest first, `limit` per page, continuing after the `cursor` entry (BR-PROJECT-21,
 * DD-PROJECT-02). Ties on created_at are broken by id, so pages never repeat or skip an entry.
 * Filters by type, actor and time range combine with AND (BR-PROJECT-38).
 */
export async function listActivity(
  ctx: ProjectContext,
  query: z.output<typeof activityQuerySchema>,
): Promise<{ data: ActivityEntry[]; nextCursor: string | null }> {
  const projectId = ctx.project.id;
  let after = {};
  if (query.cursor) {
    const cursor = await prisma.activityLog.findFirst({
      where: { id: query.cursor, projectId },
      select: { id: true, createdAt: true },
    });
    if (!cursor) {
      throw new ValidationError([{ pointer: '/cursor', detail: 'Unknown cursor' }]);
    }
    after = {
      OR: [
        { createdAt: { lt: cursor.createdAt } },
        { createdAt: cursor.createdAt, id: { lt: cursor.id } },
      ],
    };
  }

  const createdAt =
    query.from || query.to
      ? {
          createdAt: {
            ...(query.from ? { gte: new Date(query.from) } : {}),
            ...(query.to ? { lt: new Date(query.to) } : {}),
          },
        }
      : {};
  const rows = await prisma.activityLog.findMany({
    where: {
      AND: [
        { projectId },
        after,
        createdAt,
        query.entityType ? { entityType: query.entityType } : {},
        query.actorId ? { actorId: query.actorId } : {},
      ],
    },
    orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
    take: query.limit + 1,
    include: { actor: { select: { id: true, name: true } } },
  });
  const page = rows.slice(0, query.limit);
  return {
    data: page.map((row) => ({
      id: row.id,
      action: row.action as ActivityEntry['action'],
      entityType: row.entityType as ActivityEntry['entityType'],
      entityId: row.entityId,
      summary: row.summary,
      changes: (row.changes as ActivityChanges | null) ?? null,
      actor: row.actor,
      createdAt: row.createdAt.toISOString(),
    })),
    nextCursor: rows.length > query.limit ? (page.at(-1)?.id ?? null) : null,
  };
}

/** API-PROJECT-14: everyone with an entry in this project's log, by name, for the Person filter (BR-PROJECT-38). */
export async function listActivityActors(ctx: ProjectContext): Promise<ActivityActor[]> {
  const actorIds = await prisma.activityLog.findMany({
    where: { projectId: ctx.project.id },
    distinct: ['actorId'],
    select: { actorId: true },
  });
  return prisma.user.findMany({
    where: { id: { in: actorIds.map((row) => row.actorId) } },
    select: { id: true, name: true },
    orderBy: [{ name: 'asc' }, { id: 'asc' }],
  });
}

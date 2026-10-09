import { AUDIT_ACTION_LABELS, type AuditEvent, type AuditQuery } from '@qawm/shared';
import type { Prisma } from '../../generated/prisma/client';
import { ValidationError } from '../../lib/errors';
import { prisma } from '../../lib/prisma';

/** Cursor = "<ISO time>|<id>" of the last entry, so new entries never shift a page (like the activity log). */
function decodeCursor(cursor: string): { at: Date; id: string } {
  const [at, id] = cursor.split('|');
  const date = new Date(at ?? '');
  if (!id || Number.isNaN(date.getTime())) {
    throw new ValidationError([{ pointer: '/cursor', detail: 'Invalid cursor' }]);
  }
  return { at: date, id };
}

/** BR-ADMIN-15: newest first, filterable, read only. */
export async function listAudit(
  query: AuditQuery,
): Promise<{ data: AuditEvent[]; nextCursor: string | null }> {
  const where: Prisma.AuditEventWhereInput = {
    ...(query.actorId ? { actorId: query.actorId } : {}),
    ...(query.action ? { action: query.action } : {}),
    ...(query.projectKey ? { projectKey: query.projectKey.toUpperCase() } : {}),
    ...(query.asAdmin ? { actedAs: 'ADMIN' } : {}),
    ...(query.from || query.to
      ? {
          createdAt: {
            ...(query.from ? { gte: new Date(`${query.from}T00:00:00.000Z`) } : {}),
            ...(query.to
              ? { lt: new Date(new Date(`${query.to}T00:00:00.000Z`).getTime() + 86_400_000) }
              : {}),
          },
        }
      : {}),
  };
  if (query.cursor) {
    const { at, id } = decodeCursor(query.cursor);
    where.OR = [{ createdAt: { lt: at } }, { createdAt: at, id: { lt: id } }];
  }
  const rows = await prisma.auditEvent.findMany({
    where,
    orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
    take: query.limit + 1,
    include: { actor: { select: { id: true, name: true } } },
  });
  const page = rows.slice(0, query.limit);
  const last = page.at(-1);
  return {
    data: page.map((row) => ({
      id: row.id,
      at: row.createdAt.toISOString(),
      actor: row.actor,
      action: row.action,
      actionLabel: AUDIT_ACTION_LABELS[row.action] ?? row.action,
      targetType: row.targetType,
      targetName: row.targetName,
      projectKey: row.projectKey,
      before: (row.before as Record<string, unknown> | null) ?? null,
      after: (row.after as Record<string, unknown> | null) ?? null,
      actedAs: row.actedAs,
      ip: row.ip,
    })),
    nextCursor:
      rows.length > query.limit && last ? `${last.createdAt.toISOString()}|${last.id}` : null,
  };
}

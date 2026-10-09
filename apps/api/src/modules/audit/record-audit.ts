import type { Prisma } from '../../generated/prisma/client';
import type { Tx } from '../../lib/db-types';
import type { prisma } from '../../lib/prisma';

export type AuditInput = {
  actorId: string | null;
  action: string;
  targetType: 'user' | 'project' | 'release' | 'milestone' | 'member' | 'session';
  targetId?: string | null;
  /** Readable name frozen now: an email, a project key, a release name. */
  targetName: string;
  projectKey?: string | null;
  before?: Record<string, unknown> | null;
  after?: Record<string, unknown> | null;
  actedAs?: 'ADMIN' | null;
  ip?: string | null;
};

/**
 * Writes one audit event (BR-ADMIN-14, BR-ADMIN-15). Pass the transaction client when the event describes
 * a change, so the change and its entry are saved together (BR-ADMIN-16). Sign-in events have no change
 * to join and use the plain client.
 */
export async function recordAudit(db: Tx | typeof prisma, input: AuditInput): Promise<void> {
  await db.auditEvent.create({
    data: {
      actorId: input.actorId,
      action: input.action,
      targetType: input.targetType,
      targetId: input.targetId ?? null,
      targetName: input.targetName,
      projectKey: input.projectKey ?? null,
      before: (input.before ?? undefined) as Prisma.InputJsonValue | undefined,
      after: (input.after ?? undefined) as Prisma.InputJsonValue | undefined,
      actedAs: input.actedAs ?? null,
      ip: input.ip ?? null,
    },
  });
}

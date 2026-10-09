import type { ActivityAction, ActivityChanges, ActivityEntityType } from '@qawm/shared';
import type { Prisma } from '../../generated/prisma/client';
import type { Tx } from '../../lib/db-types';
import { recordAudit } from '../audit/record-audit';

export type ActivityInput = {
  projectId: string;
  actorId: string;
  action: ActivityAction;
  entityType: ActivityEntityType;
  entityId: string;
  /** The sentence people read, built now so later renames don't change it (BR-PROJECT-20). */
  summary: string;
  changes?: ActivityChanges | null;
};

/**
 * Writes one activity entry. It takes the transaction client, so it can only run inside the
 * transaction of the change it describes: both are saved, or neither (BR-PROJECT-22, DD-PROJECT-02).
 */
export async function recordActivity(tx: Tx, input: ActivityInput): Promise<void> {
  await tx.activityLog.create({
    data: {
      projectId: input.projectId,
      actorId: input.actorId,
      action: input.action,
      entityType: input.entityType,
      entityId: input.entityId,
      summary: input.summary,
      // Values are plain JSON (strings, null); the cast only tells Prisma so.
      changes: (input.changes ?? undefined) as Prisma.InputJsonValue | undefined,
    },
  });
  await auditAdminWrite(tx, input);
}

/**
 * BR-ADMIN-14: a write by an Admin on a project they are not a member of is also an audit event,
 * marked actedAs = ADMIN, in the same transaction.
 */
async function auditAdminWrite(tx: Tx, input: ActivityInput): Promise<void> {
  const actor = await tx.user.findUnique({
    where: { id: input.actorId },
    select: {
      globalRole: true,
      memberships: { where: { projectId: input.projectId }, select: { userId: true } },
    },
  });
  if (actor?.globalRole !== 'ADMIN' || actor.memberships.length > 0) return;
  // The caller already passed loadProject() for this project; only its key is read here.
  // eslint-disable-next-line no-restricted-syntax
  const project = await tx.project.findUnique({
    where: { id: input.projectId },
    select: { key: true },
  });
  const before: Record<string, unknown> = {};
  const after: Record<string, unknown> = {};
  for (const [field, change] of Object.entries(input.changes ?? {})) {
    before[field] = change.from;
    after[field] = change.to;
  }
  const hasChanges = Object.keys(after).length > 0;
  await recordAudit(tx, {
    actorId: input.actorId,
    action: input.action,
    targetType: input.entityType,
    targetId: input.entityId,
    targetName: input.summary,
    projectKey: project?.key ?? null,
    before: hasChanges ? before : null,
    after: hasChanges ? after : null,
    actedAs: 'ADMIN',
  });
}

/**
 * The fields of `after` whose value differs from `before`, as `{ field: { from, to } }`.
 * Returns null when nothing changed, so callers can skip the write (DD-PROJECT-02 "no-op edit").
 */
export function diff(
  before: Record<string, unknown>,
  after: Record<string, unknown>,
): ActivityChanges | null {
  const changes: ActivityChanges = {};
  for (const [field, to] of Object.entries(after)) {
    if (to === undefined) continue;
    const from = before[field] ?? null;
    if (from !== (to ?? null)) changes[field] = { from, to: to ?? null };
  }
  return Object.keys(changes).length > 0 ? changes : null;
}

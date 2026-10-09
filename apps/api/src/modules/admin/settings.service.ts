import type { WorkspaceSettings } from '@qawm/shared';
import { DEFAULT_GUEST_AREAS } from '@qawm/shared';
import type { Tx } from '../../lib/db-types';
import { prisma } from '../../lib/prisma';
import { recordAudit } from '../audit/record-audit';

const ID = 'default';

type Db = Tx | typeof prisma;

function toDto(row: {
  defaultGuestAreas: string[];
  auditRetentionDays: number;
}): WorkspaceSettings {
  return {
    defaultGuestAreas: row.defaultGuestAreas as WorkspaceSettings['defaultGuestAreas'],
    auditRetentionDays: row.auditRetentionDays,
  };
}

/** The one settings row (BR-ADMIN-17); created with the defaults the first time it is read. */
export async function getSettings(db: Db = prisma): Promise<WorkspaceSettings> {
  const row = await db.workspaceSetting.upsert({
    where: { id: ID },
    create: { id: ID, defaultGuestAreas: DEFAULT_GUEST_AREAS },
    update: {},
  });
  return toDto(row);
}

/** API-ADMIN-14: saves the settings and writes one audit event with what changed. */
export async function updateSettings(
  actorId: string,
  body: WorkspaceSettings,
  ip: string | null,
): Promise<WorkspaceSettings> {
  return prisma.$transaction(async (tx) => {
    const before = await getSettings(tx);
    const row = await tx.workspaceSetting.update({
      where: { id: ID },
      data: {
        defaultGuestAreas: body.defaultGuestAreas,
        auditRetentionDays: body.auditRetentionDays,
      },
    });
    const after = toDto(row);
    if (JSON.stringify(before) !== JSON.stringify(after)) {
      await recordAudit(tx, {
        actorId,
        action: 'settings.updated',
        targetType: 'settings',
        targetName: 'Workspace settings',
        before,
        after,
        ip,
      });
    }
    return after;
  });
}

/** BR-ADMIN-17: deletes audit events older than the retention period. Returns how many went. */
export async function purgeOldAuditEvents(now = new Date()): Promise<number> {
  const { auditRetentionDays } = await getSettings();
  const cutoff = new Date(now.getTime() - auditRetentionDays * 24 * 60 * 60 * 1000);
  const { count } = await prisma.auditEvent.deleteMany({ where: { createdAt: { lt: cutoff } } });
  return count;
}

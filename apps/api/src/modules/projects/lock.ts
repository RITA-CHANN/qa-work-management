import type { Tx } from '../../lib/db-types';
import { NotFoundError } from '../../lib/errors';
import { assertNotArchived } from './permissions';

/**
 * Locks the project row until the transaction ends, and re-checks that it is still active.
 * Every write to members, releases and milestones starts with it, so two requests on one project run one
 * after the other: two Owners can't demote each other at once (BR-PROJECT-12), two sprints can't be added
 * over the same days (BR-PROJECT-30), and nothing changes while the project is being archived.
 */
export async function lockActiveProject(tx: Tx, projectId: string): Promise<void> {
  const rows = await tx.$queryRaw<{ archived_at: Date | null }[]>`
    SELECT archived_at FROM projects WHERE id = ${projectId} FOR UPDATE`;
  const row = rows[0];
  if (!row) throw new NotFoundError('MSG-PROJECT-06');
  assertNotArchived({ archivedAt: row.archived_at });
}

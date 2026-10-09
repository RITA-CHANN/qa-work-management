import {
  RELEASE_NEXT,
  releaseDatesInOrder,
  type Release,
  type ReleaseStatus,
  type releaseCreateSchema,
  type releaseUpdateSchema,
} from '@qawm/shared';
import type { z } from 'zod';
import type { Release as ReleaseRow } from '../../generated/prisma/client';
import { fromDbDate, fromDbDateOrNull, toDbDate } from '../../lib/dates';
import { isUniqueViolation, type Tx } from '../../lib/db-types';
import {
  ConflictError,
  NotFoundError,
  UnprocessableError,
  ValidationError,
} from '../../lib/errors';
import { prisma } from '../../lib/prisma';
import { diff, recordActivity } from '../activity/record-activity';
import { summaries } from '../activity/summaries';
import type { ProjectContext } from '../projects/loader';
import { lockActiveProject } from '../projects/lock';
import { assertCan, assertNotArchived } from '../projects/permissions';
import { versionConflict } from '../projects/projects.service';

type ReleaseWithCount = ReleaseRow & { _count: { milestones: number } };

const withCount = { _count: { select: { milestones: true } } } as const;

function toRelease(row: ReleaseWithCount): Release {
  return {
    id: row.id,
    name: row.name,
    status: row.status,
    startDate: fromDbDateOrNull(row.startDate),
    targetDate: fromDbDateOrNull(row.targetDate),
    version: row.version,
    milestoneCount: row._count.milestones,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

/** BR-PROJECT-14: names compare trimmed and case-insensitive. */
export const normalizeName = (name: string) => name.trim().toLowerCase();

const nameTaken = () => new ConflictError('RELEASE_NAME_TAKEN', 'MSG-PROJECT-14');
const dateOrNull = (date: string | null | undefined) => (date ? toDbDate(date) : null);

const STATUS_ORDER: Record<ReleaseStatus, number> = { ACTIVE: 0, PLANNED: 1, RELEASED: 2 };

/** API-RELEASE-01: Active, then Planned (by start date), then Released (newest first). */
export async function listReleases(ctx: ProjectContext): Promise<Release[]> {
  const rows = await prisma.release.findMany({
    where: { projectId: ctx.project.id },
    include: withCount,
    orderBy: { createdAt: 'asc' },
  });
  const time = (date: Date | null, empty: number) => date?.getTime() ?? empty;
  return rows
    .sort((a, b) => {
      const byStatus = STATUS_ORDER[a.status] - STATUS_ORDER[b.status];
      if (byStatus !== 0) return byStatus;
      if (a.status === 'RELEASED') {
        return (
          time(b.targetDate, 0) - time(a.targetDate, 0) ||
          b.createdAt.getTime() - a.createdAt.getTime()
        );
      }
      return (
        time(a.startDate, Infinity) - time(b.startDate, Infinity) || a.name.localeCompare(b.name)
      );
    })
    .map(toRelease);
}

/** A release of this project, or 404 (a release id of another project is "not found" too). */
export async function findRelease(tx: Tx, projectId: string, id: string) {
  const row = await tx.release.findFirst({ where: { id, projectId }, include: withCount });
  if (!row) throw new NotFoundError();
  return row;
}

/** API-RELEASE-02: always PLANNED. */
export async function createRelease(
  ctx: ProjectContext,
  body: z.output<typeof releaseCreateSchema>,
): Promise<Release> {
  const { project, user } = ctx;
  assertCan(ctx.role, 'release:write');
  assertNotArchived(project);
  try {
    return await prisma.$transaction(async (tx) => {
      await lockActiveProject(tx, project.id);
      const row = await tx.release.create({
        data: {
          projectId: project.id,
          name: body.name,
          nameNormalized: normalizeName(body.name),
          startDate: dateOrNull(body.startDate),
          targetDate: dateOrNull(body.targetDate),
        },
        include: withCount,
      });
      await recordActivity(tx, {
        projectId: project.id,
        actorId: user.id,
        action: 'release.created',
        entityType: 'release',
        entityId: row.id,
        summary: summaries.releaseCreated(user.name, row.name),
      });
      return toRelease(row);
    });
  } catch (error) {
    if (isUniqueViolation(error)) throw nameTaken();
    throw error;
  }
}

/**
 * API-RELEASE-03: edit name and dates, and/or move the status one step forward (DD-PROJECT-04).
 * Optimistic locking as for projects (DD-PROJECT-03).
 */
export async function updateRelease(
  ctx: ProjectContext,
  id: string,
  body: z.output<typeof releaseUpdateSchema>,
): Promise<Release> {
  const { project, user } = ctx;
  assertCan(ctx.role, 'release:write');
  assertNotArchived(project);

  try {
    return await prisma.$transaction(async (tx) => {
      await lockActiveProject(tx, project.id);
      const row = await findRelease(tx, project.id, id);
      if (body.version !== row.version) throw versionConflict();

      const before = {
        name: row.name,
        startDate: fromDbDateOrNull(row.startDate),
        targetDate: fromDbDateOrNull(row.targetDate),
      };
      const changes = diff(before, {
        name: body.name,
        startDate: body.startDate,
        targetDate: body.targetDate,
      });
      const after = { ...before, ...stripUndefined(body) };

      if (changes && (changes.startDate || changes.targetDate)) {
        // BR-PROJECT-15 against the stored date the body didn't send.
        if (!releaseDatesInOrder(after.startDate, after.targetDate)) {
          throw ValidationError.field('/targetDate', 'MSG-PROJECT-15');
        }
        await assertMilestonesStillFit(tx, row.id, after);
      }
      if (changes?.name) {
        const clash = await tx.release.findFirst({
          where: {
            projectId: project.id,
            nameNormalized: normalizeName(after.name),
            id: { not: id },
          },
        });
        if (clash) throw nameTaken();
      }

      const newStatus = body.status && body.status !== row.status ? body.status : undefined;
      if (newStatus) await assertCanMoveTo(tx, row, newStatus);
      if (!changes && !newStatus) return toRelease(row);

      const { count } = await tx.release.updateMany({
        where: { id, version: body.version },
        data: {
          ...(changes?.name ? { name: after.name, nameNormalized: normalizeName(after.name) } : {}),
          ...(changes?.startDate ? { startDate: dateOrNull(after.startDate) } : {}),
          ...(changes?.targetDate ? { targetDate: dateOrNull(after.targetDate) } : {}),
          ...(newStatus ? { status: newStatus } : {}),
          version: { increment: 1 },
        },
      });
      if (count === 0) throw versionConflict();

      if (changes) {
        await recordActivity(tx, {
          projectId: project.id,
          actorId: user.id,
          action: 'release.updated',
          entityType: 'release',
          entityId: id,
          summary: summaries.releaseUpdated(user.name, after.name),
          changes,
        });
      }
      if (newStatus) {
        await recordActivity(tx, {
          projectId: project.id,
          actorId: user.id,
          action: 'release.status_changed',
          entityType: 'release',
          entityId: id,
          summary: summaries.releaseStatusChanged(user.name, after.name, row.status, newStatus),
          changes: { status: { from: row.status, to: newStatus } },
        });
      }
      return toRelease(await findRelease(tx, project.id, id));
    });
  } catch (error) {
    // A rename raced with another one. (Two activations can't race: both lock the project row first;
    // the partial unique index is only the last line of defence for BR-PROJECT-17.)
    if (isUniqueViolation(error) && body.name !== undefined) throw nameTaken();
    throw error;
  }
}

function stripUndefined<T extends Record<string, unknown>>(body: T) {
  return Object.fromEntries(
    Object.entries(body).filter(([field, value]) => value !== undefined && field !== 'version'),
  ) as { name?: string; startDate?: string | null; targetDate?: string | null };
}

/** DD-PROJECT-04: one step forward only; one ACTIVE release; RELEASED only with every milestone COMPLETED. */
async function assertCanMoveTo(tx: Tx, row: ReleaseRow, status: ReleaseStatus): Promise<void> {
  if (RELEASE_NEXT[row.status] !== status) {
    throw new ConflictError('INVALID_TRANSITION', 'MSG-PROJECT-16');
  }
  if (status === 'ACTIVE') {
    const active = await tx.release.findFirst({
      where: { projectId: row.projectId, status: 'ACTIVE', id: { not: row.id } },
    });
    if (active) {
      throw new UnprocessableError('ACTIVE_RELEASE_EXISTS', 'MSG-PROJECT-17', {
        name: active.name,
      });
    }
  }
  if (status === 'RELEASED') {
    const open = await tx.milestone.count({
      where: { releaseId: row.id, status: { not: 'COMPLETED' } },
    });
    if (open > 0) throw new UnprocessableError('OPEN_MILESTONES', 'MSG-PROJECT-27');
  }
}

/** BR-PROJECT-29: new release dates must still contain every milestone of the release. */
async function assertMilestonesStillFit(
  tx: Tx,
  releaseId: string,
  release: { name: string; startDate: string | null; targetDate: string | null },
): Promise<void> {
  const milestones = await tx.milestone.findMany({ where: { releaseId } });
  const outside = milestones.some(
    (m) =>
      (release.startDate && fromDbDate(m.startDate) < release.startDate) ||
      (release.targetDate && fromDbDate(m.endDate) > release.targetDate),
  );
  if (outside) {
    throw new UnprocessableError('MILESTONE_OUTSIDE_RELEASE', 'MSG-PROJECT-25', {
      name: release.name,
      start: release.startDate ?? '…',
      end: release.targetDate ?? '…',
    });
  }
}

/** API-RELEASE-04: only a PLANNED release without milestones (BR-PROJECT-18). */
export async function deleteRelease(ctx: ProjectContext, id: string): Promise<void> {
  const { project, user } = ctx;
  assertCan(ctx.role, 'release:write');
  assertNotArchived(project);
  await prisma.$transaction(async (tx) => {
    await lockActiveProject(tx, project.id);
    const row = await findRelease(tx, project.id, id);
    if (row.status !== 'PLANNED' || row._count.milestones > 0) {
      throw new UnprocessableError('DELETE_NOT_ALLOWED', 'MSG-PROJECT-18');
    }
    await tx.release.delete({ where: { id } });
    await recordActivity(tx, {
      projectId: project.id,
      actorId: user.id,
      action: 'release.deleted',
      entityType: 'release',
      entityId: id,
      summary: summaries.releaseDeleted(user.name, row.name),
    });
  });
}

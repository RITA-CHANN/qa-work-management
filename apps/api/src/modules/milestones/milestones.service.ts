import {
  inclusiveDays,
  MILESTONE_NEXT,
  milestoneLengthOk,
  type Milestone,
  type MilestoneStatus,
  type makeMilestoneCreateSchema,
  type makeMilestoneUpdateSchema,
} from '@qawm/shared';
import type { z } from 'zod';
import { env } from '../../config/env';
import type { Milestone as MilestoneRow, Release } from '../../generated/prisma/client';
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
import { findRelease, normalizeName } from '../releases/releases.service';
import { assertInsideRelease, assertNoOverlap } from './dates';

type CreateBody = z.output<ReturnType<typeof makeMilestoneCreateSchema>>;
type UpdateBody = z.output<ReturnType<typeof makeMilestoneUpdateSchema>>;

function toMilestone(row: MilestoneRow): Milestone {
  const startDate = fromDbDate(row.startDate);
  const endDate = fromDbDate(row.endDate);
  return {
    id: row.id,
    releaseId: row.releaseId,
    name: row.name,
    goal: row.goal,
    startDate,
    endDate,
    days: inclusiveDays(startDate, endDate),
    status: row.status,
    version: row.version,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

const nameTaken = () => new ConflictError('MILESTONE_NAME_TAKEN', 'MSG-PROJECT-30');

/** API-MILESTONE-01, sorted by start date. A releaseId of another project simply matches nothing. */
export async function listMilestones(
  ctx: ProjectContext,
  releaseId: string | undefined,
): Promise<Milestone[]> {
  const rows = await prisma.milestone.findMany({
    where: { projectId: ctx.project.id, ...(releaseId ? { releaseId } : {}) },
    orderBy: [{ startDate: 'asc' }, { name: 'asc' }],
  });
  return rows.map(toMilestone);
}

/** BR-PROJECT-29 and BR-PROJECT-30 for a milestone of `release` with these dates. */
async function assertDatesFit(
  tx: Tx,
  release: Release,
  dates: { startDate: string; endDate: string },
  excludeId?: string,
): Promise<void> {
  assertInsideRelease(dates, {
    name: release.name,
    startDate: fromDbDateOrNull(release.startDate),
    targetDate: fromDbDateOrNull(release.targetDate),
  });
  const others = await tx.milestone.findMany({
    where: { releaseId: release.id, ...(excludeId ? { id: { not: excludeId } } : {}) },
  });
  assertNoOverlap(dates, others.map(toMilestone));
}

async function assertNameFree(tx: Tx, projectId: string, name: string, excludeId?: string) {
  const clash = await tx.milestone.findFirst({
    where: {
      projectId,
      nameNormalized: normalizeName(name),
      ...(excludeId ? { id: { not: excludeId } } : {}),
    },
  });
  if (clash) throw nameTaken();
}

/** API-MILESTONE-02: always PLANNED; the project comes from the release, never from the body. */
export async function createMilestone(ctx: ProjectContext, body: CreateBody): Promise<Milestone> {
  const { project, user } = ctx;
  assertCan(ctx.role, 'milestone:write');
  assertNotArchived(project);
  try {
    return await prisma.$transaction(async (tx) => {
      await lockActiveProject(tx, project.id);
      const release = await findRelease(tx, project.id, body.releaseId);
      if (release.status === 'RELEASED') {
        throw new UnprocessableError('RELEASE_CLOSED', 'MSG-PROJECT-32', { name: release.name });
      }
      await assertNameFree(tx, project.id, body.name);
      await assertDatesFit(tx, release, body);
      const row = await tx.milestone.create({
        data: {
          projectId: project.id,
          releaseId: release.id,
          name: body.name,
          nameNormalized: normalizeName(body.name),
          goal: body.goal ?? null,
          startDate: toDbDate(body.startDate),
          endDate: toDbDate(body.endDate),
        },
      });
      await recordActivity(tx, {
        projectId: project.id,
        actorId: user.id,
        action: 'milestone.created',
        entityType: 'milestone',
        entityId: row.id,
        summary: summaries.milestoneCreated(user.name, row.name),
      });
      return toMilestone(row);
    });
  } catch (error) {
    if (isUniqueViolation(error)) throw nameTaken();
    throw error;
  }
}

/** API-MILESTONE-03: edit, and/or move the status one step forward (DD-PROJECT-04). */
export async function updateMilestone(
  ctx: ProjectContext,
  id: string,
  body: UpdateBody,
): Promise<Milestone> {
  const { project, user } = ctx;
  assertCan(ctx.role, 'milestone:write');
  assertNotArchived(project);

  try {
    return await prisma.$transaction(async (tx) => {
      await lockActiveProject(tx, project.id);
      const row = await tx.milestone.findFirst({
        where: { id, projectId: project.id },
        include: { release: true },
      });
      if (!row) throw new NotFoundError();
      if (body.version !== row.version) throw versionConflict();

      const current = toMilestone(row);
      const before = {
        name: current.name,
        goal: current.goal,
        startDate: current.startDate,
        endDate: current.endDate,
      };
      const changes = diff(before, {
        name: body.name,
        goal: body.goal,
        startDate: body.startDate,
        endDate: body.endDate,
      });
      const after = {
        name: body.name ?? before.name,
        goal: body.goal === undefined ? before.goal : body.goal,
        startDate: body.startDate ?? before.startDate,
        endDate: body.endDate ?? before.endDate,
      };

      if (changes?.startDate || changes?.endDate) {
        // BR-PROJECT-28 against the stored date the body didn't send.
        if (!milestoneLengthOk(after.startDate, after.endDate, env.MILESTONE_MAX_DAYS)) {
          throw ValidationError.field('/endDate', 'MSG-PROJECT-24', {
            maxDays: env.MILESTONE_MAX_DAYS,
          });
        }
        await assertDatesFit(tx, row.release, after, id);
      }
      if (changes?.name) await assertNameFree(tx, project.id, after.name, id);

      const newStatus = body.status && body.status !== row.status ? body.status : undefined;
      if (newStatus) await assertCanMoveTo(tx, row, newStatus);
      if (!changes && !newStatus) return current;

      const { count } = await tx.milestone.updateMany({
        where: { id, version: body.version },
        data: {
          ...(changes?.name ? { name: after.name, nameNormalized: normalizeName(after.name) } : {}),
          ...(changes?.goal ? { goal: after.goal } : {}),
          ...(changes?.startDate ? { startDate: toDbDate(after.startDate) } : {}),
          ...(changes?.endDate ? { endDate: toDbDate(after.endDate) } : {}),
          ...(newStatus ? { status: newStatus } : {}),
          version: { increment: 1 },
        },
      });
      if (count === 0) throw versionConflict();

      if (changes) {
        await recordActivity(tx, {
          projectId: project.id,
          actorId: user.id,
          action: 'milestone.updated',
          entityType: 'milestone',
          entityId: id,
          summary: summaries.milestoneUpdated(user.name, after.name),
          changes,
        });
      }
      if (newStatus) {
        await recordActivity(tx, {
          projectId: project.id,
          actorId: user.id,
          action: 'milestone.status_changed',
          entityType: 'milestone',
          entityId: id,
          summary: summaries.milestoneStatusChanged(user.name, after.name, row.status, newStatus),
          changes: { status: { from: row.status, to: newStatus } },
        });
      }
      return toMilestone(await tx.milestone.findUniqueOrThrow({ where: { id } }));
    });
  } catch (error) {
    if (isUniqueViolation(error) && body.name !== undefined) throw nameTaken();
    throw error;
  }
}

/** DD-PROJECT-04: one step forward; ACTIVE only when the release is ACTIVE and no other milestone is. */
async function assertCanMoveTo(
  tx: Tx,
  row: MilestoneRow & { release: Release },
  status: MilestoneStatus,
): Promise<void> {
  if (MILESTONE_NEXT[row.status] !== status) {
    throw new ConflictError('INVALID_TRANSITION', 'MSG-PROJECT-28');
  }
  if (status === 'ACTIVE') {
    const otherActive = await tx.milestone.count({
      where: { projectId: row.projectId, status: 'ACTIVE', id: { not: row.id } },
    });
    if (row.release.status !== 'ACTIVE' || otherActive > 0) {
      throw new UnprocessableError('CANNOT_ACTIVATE_MILESTONE', 'MSG-PROJECT-29');
    }
  }
}

/** API-MILESTONE-04: only while PLANNED (BR-PROJECT-33). */
export async function deleteMilestone(ctx: ProjectContext, id: string): Promise<void> {
  const { project, user } = ctx;
  assertCan(ctx.role, 'milestone:write');
  assertNotArchived(project);
  await prisma.$transaction(async (tx) => {
    await lockActiveProject(tx, project.id);
    const row = await tx.milestone.findFirst({ where: { id, projectId: project.id } });
    if (!row) throw new NotFoundError();
    if (row.status !== 'PLANNED') {
      throw new UnprocessableError('DELETE_NOT_ALLOWED', 'MSG-PROJECT-31');
    }
    await tx.milestone.delete({ where: { id } });
    await recordActivity(tx, {
      projectId: project.id,
      actorId: user.id,
      action: 'milestone.deleted',
      entityType: 'milestone',
      entityId: id,
      summary: summaries.milestoneDeleted(user.name, row.name),
    });
  });
}

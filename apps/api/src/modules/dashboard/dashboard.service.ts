import {
  canSeeArea,
  DASHBOARD_AREAS,
  daysBetween,
  todayIso,
  type ProjectDashboard,
} from '@qawm/shared';
import { fromDbDate, fromDbDateOrNull } from '../../lib/dates';
import { prisma } from '../../lib/prisma';
import { listActivity } from '../activity/activity.service';
import type { ProjectContext } from '../projects/loader';
import { buildDeadlines, focusRelease, teamCounts } from './dashboard.logic';

/** Recent activity entries on the dashboard (BR-DASH-07). */
const RECENT_ACTIVITY = 10;

/**
 * API-DASH-01: everything SCR-DASH-01 shows, in one response. Call after loadProject and
 * assertArea(ctx, 'dashboard'). Each part is read only if the caller may see its area (BR-GUEST-03); a part
 * that is left out is not even queried.
 */
export async function readDashboard(ctx: ProjectContext): Promise<ProjectDashboard> {
  const asOf = todayIso();
  const areas = DASHBOARD_AREAS.filter((area) =>
    canSeeArea(ctx.access, ctx.project.guestAreas, area),
  );
  const dashboard: ProjectDashboard = { asOf, areas };
  const projectId = ctx.project.id;

  if (areas.includes('releases')) {
    const [releaseRows, sprintRows] = await Promise.all([
      prisma.release.findMany({ where: { projectId }, orderBy: { createdAt: 'asc' } }),
      prisma.milestone.findMany({ where: { projectId }, orderBy: { startDate: 'asc' } }),
    ]);
    const releases = releaseRows.map((r) => ({
      id: r.id,
      name: r.name,
      status: r.status,
      startDate: fromDbDateOrNull(r.startDate),
      targetDate: fromDbDateOrNull(r.targetDate),
    }));
    const sprints = sprintRows.map((m) => ({
      id: m.id,
      releaseId: m.releaseId,
      name: m.name,
      goal: m.goal,
      status: m.status,
      startDate: fromDbDate(m.startDate),
      endDate: fromDbDate(m.endDate),
    }));

    const release = focusRelease(releases);
    dashboard.release = release
      ? {
          ...release,
          daysToTarget: release.targetDate ? daysBetween(asOf, release.targetDate) : null,
          sprints: sprints
            .filter((m) => m.releaseId === release.id)
            .map(({ id, name, status }) => ({ id, name, status })),
        }
      : null;
    const sprint = sprints.find((m) => m.status === 'ACTIVE');
    dashboard.sprint = sprint
      ? {
          id: sprint.id,
          name: sprint.name,
          goal: sprint.goal,
          startDate: sprint.startDate,
          endDate: sprint.endDate,
          daysLeft: daysBetween(asOf, sprint.endDate),
        }
      : null;
    dashboard.deadlines = buildDeadlines(releases, sprints, asOf);
  }

  if (areas.includes('members')) {
    // A Guest counts only the non-Guest members and themself (BR-GUEST-05), as in API-PROJECT-08.
    const members = await prisma.projectMember.findMany({
      where: {
        projectId,
        ...(ctx.access === 'GUEST'
          ? { OR: [{ access: { not: 'GUEST' } }, { userId: ctx.user.id }] }
          : {}),
      },
      select: { access: true, jobTitle: true },
    });
    dashboard.team = teamCounts(members);
  }

  if (areas.includes('activity')) {
    dashboard.activity = (await listActivity(ctx, { limit: RECENT_ACTIVITY })).data;
  }
  return dashboard;
}

import type { AdminOverview, AdminProject } from '@qawm/shared';
import type { adminProjectListQuerySchema } from '@qawm/shared';
import type { z } from 'zod';
import { fromDbDate } from '../../lib/dates';
import { prisma } from '../../lib/prisma';
import { PROJECT_ADMIN_ROLES } from './project-admins';

/** BR-ADMIN-02, BR-ADMIN-03: every project, archived included, with its admins and current plan. */
export async function listAdminProjects(
  query: z.output<typeof adminProjectListQuerySchema>,
): Promise<AdminProject[]> {
  const rows = await prisma.project.findMany({
    where: {
      ...(query.status === 'active' ? { archivedAt: null } : {}),
      ...(query.status === 'archived' ? { archivedAt: { not: null } } : {}),
      ...(query.search
        ? {
            OR: [
              { key: { contains: query.search, mode: 'insensitive' } },
              { name: { contains: query.search, mode: 'insensitive' } },
            ],
          }
        : {}),
    },
    orderBy: [{ archivedAt: { sort: 'asc', nulls: 'first' } }, { name: 'asc' }],
    include: {
      _count: { select: { members: true } },
      members: {
        where: { role: { in: PROJECT_ADMIN_ROLES } },
        select: { user: { select: { id: true, name: true } } },
      },
      releases: { where: { status: 'ACTIVE' }, select: { name: true, targetDate: true } },
      milestones: { where: { status: 'ACTIVE' }, select: { name: true, endDate: true } },
      activities: { orderBy: { createdAt: 'desc' }, take: 1, select: { createdAt: true } },
    },
  });
  return rows.map((row) => {
    const release = row.releases[0];
    const milestone = row.milestones[0];
    return {
      key: row.key,
      name: row.name,
      archived: !!row.archivedAt,
      memberCount: row._count.members,
      projectAdmins: row.members.map((m) => m.user),
      activeRelease: release
        ? {
            name: release.name,
            targetDate: release.targetDate ? fromDbDate(release.targetDate) : null,
          }
        : null,
      activeMilestone: milestone
        ? { name: milestone.name, endDate: fromDbDate(milestone.endDate) }
        : null,
      lastActivityAt: row.activities[0]?.createdAt.toISOString() ?? null,
      createdAt: row.createdAt.toISOString(),
    };
  });
}

/** BR-ADMIN-02: KPIs of the all-projects dashboard. */
export async function adminOverview(): Promise<AdminOverview> {
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const [projects, activeUsers, totalUsers, admins, failedSignIns7d, adminActions7d] =
    await Promise.all([
      listAdminProjects({ status: 'all' }),
      prisma.user.count({ where: { status: 'ACTIVE' } }),
      prisma.user.count(),
      prisma.user.count({ where: { globalRole: 'ADMIN', status: 'ACTIVE' } }),
      prisma.auditEvent.count({
        where: { action: 'auth.sign_in_failed', createdAt: { gte: weekAgo } },
      }),
      prisma.auditEvent.count({ where: { actedAs: 'ADMIN', createdAt: { gte: weekAgo } } }),
    ]);
  return {
    activeProjects: projects.filter((p) => !p.archived).length,
    archivedProjects: projects.filter((p) => p.archived).length,
    activeUsers,
    totalUsers,
    admins,
    failedSignIns7d,
    adminActions7d,
    projects,
  };
}

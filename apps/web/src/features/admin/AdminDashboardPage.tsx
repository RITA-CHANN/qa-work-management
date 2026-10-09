import { Link } from 'react-router';
import { daysBetween, todayIso } from '@qawm/shared';
import { PageHeader } from '@/components/PageHeader';
import { Alert } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Card, KpiCard } from '@/components/ui/card';
import { errorText } from '@/features/projects/server-error';
import { useAdminOverview } from './api';
import { formatDate, formatDateTime, tableClass, tdClass, thClass } from './format';

/** SCR-ADMIN-01 All-projects dashboard (BR-ADMIN-02). Admins only. */
export function AdminDashboardPage() {
  const overview = useAdminOverview();
  if (overview.isError) return <Alert>{errorText(overview.error)}</Alert>;
  const o = overview.data;

  return (
    <>
      <PageHeader title="All projects" description="Every project in the workspace" />
      <div className="mb-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <KpiCard
          label="Active projects"
          value={o?.activeProjects ?? '—'}
          hint={`${o?.archivedProjects ?? 0} archived`}
        />
        <KpiCard mono label="Active users" value={o ? `${o.activeUsers}/${o.totalUsers}` : '—'} />
        <KpiCard mono label="Admins" value={o?.admins ?? '—'} />
        <KpiCard
          label="Failed sign-ins (7 days)"
          value={o?.failedSignIns7d ?? '—'}
          tone={o && o.failedSignIns7d > 0 ? 'warning' : 'neutral'}
        />
        <KpiCard mono label="Actions as Admin (7 days)" value={o?.adminActions7d ?? '—'} />
      </div>

      <Card
        title="Projects"
        actions={
          <Link
            className="text-sm font-semibold text-primary-tint-foreground hover:underline"
            to="/admin/projects"
          >
            Manage projects
          </Link>
        }
      >
        {!o ? (
          <p role="status">Loading…</p>
        ) : (
          <div className="overflow-x-auto">
            <table className={tableClass}>
              <caption className="sr-only">Project health</caption>
              <thead>
                <tr>
                  <th className={thClass}>Project</th>
                  <th className={thClass}>Status</th>
                  <th className={thClass}>Project admins</th>
                  <th className={thClass}>Members</th>
                  <th className={thClass}>Active release</th>
                  <th className={thClass}>Current sprint</th>
                  <th className={thClass}>Last activity</th>
                </tr>
              </thead>
              <tbody>
                {o.projects.map((p) => {
                  const overdue =
                    p.activeRelease?.targetDate &&
                    daysBetween(todayIso(), p.activeRelease.targetDate) < 0;
                  return (
                    <tr key={p.key}>
                      <td className={tdClass}>
                        <Link to={`/projects/${p.key}`} className="font-semibold hover:underline">
                          {p.name}
                        </Link>
                        <span className="ml-2 font-mono text-xs text-muted-foreground">
                          {p.key}
                        </span>
                      </td>
                      <td className={tdClass}>
                        <Badge tone={p.archived ? 'warning' : 'active'}>
                          {p.archived ? 'Archived' : 'Active'}
                        </Badge>
                      </td>
                      <td className={tdClass}>
                        {p.projectAdmins.map((a) => a.name).join(', ') || '—'}
                      </td>
                      <td className={`${tdClass} font-mono`}>{p.memberCount}</td>
                      <td className={tdClass}>
                        {p.activeRelease ? (
                          <>
                            {p.activeRelease.name}
                            {p.activeRelease.targetDate && (
                              <span
                                className={
                                  overdue
                                    ? 'ml-2 font-semibold text-destructive'
                                    : 'ml-2 text-muted-foreground'
                                }
                              >
                                {overdue
                                  ? 'Overdue'
                                  : `target ${formatDate(p.activeRelease.targetDate)}`}
                              </span>
                            )}
                          </>
                        ) : (
                          '—'
                        )}
                      </td>
                      <td className={tdClass}>{p.activeMilestone?.name ?? '—'}</td>
                      <td className={`${tdClass} text-muted-foreground`}>
                        {p.lastActivityAt ? formatDateTime(p.lastActivityAt) : '—'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </>
  );
}

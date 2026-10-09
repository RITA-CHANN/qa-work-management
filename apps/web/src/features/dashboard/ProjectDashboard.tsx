import type { ReactNode } from 'react';
import { Link } from 'react-router';
import {
  msg,
  type Deadline,
  type DashboardArea,
  type Project,
  type ProjectDashboard as Dashboard,
} from '@qawm/shared';
import { EmptyState } from '@/components/EmptyState';
import { PageHeader } from '@/components/PageHeader';
import { Alert } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Card, KpiCard, ProgressBar } from '@/components/ui/card';
import { ActivityList } from '@/features/projects/ActivityList';
import { useDashboard, useProject } from '@/features/projects/api';
import { useProjectAccess } from '@/features/projects/access';
import { ACCESS_LABELS, JOB_TITLE_NAMES } from '@/features/projects/labels';
import { errorText } from '@/features/projects/server-error';
import { cn } from '@/lib/utils';

const statusTone = {
  PLANNED: 'neutral',
  ACTIVE: 'info',
  RELEASED: 'active',
  COMPLETED: 'active',
} as const;
/** "2026-10-09" → "9 Oct 2026", read as a calendar date (no time zone shift). */
const formatDate = (iso: string) =>
  new Date(`${iso}T00:00:00`).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
const statusLabel = (status: string) => status.charAt(0) + status.slice(1).toLowerCase();
const plural = (n: number, word: string) => `${n} ${n === 1 ? word : `${word}s`}`;

/** Days counted by the API from `asOf` (BR-DASH-03, BR-PROJECT-34, BR-DASH-05); written in words, not colour only. */
const toTarget = (days: number) =>
  days < 0
    ? `Overdue by ${plural(-days, 'day')}`
    : days === 0
      ? 'Due today'
      : `${plural(days, 'day')} to target`;
const leftInSprint = (days: number) =>
  days < 0 ? `Overdue by ${plural(-days, 'day')}` : `${plural(days, 'day')} left`;
const whenDue = (days: number) =>
  days < 0
    ? `Overdue by ${plural(-days, 'day')}`
    : days === 0
      ? 'Today'
      : `In ${plural(days, 'day')}`;

/**
 * SCR-DASH-01 Project dashboard: one project, monitoring only (BR-DASH-01, BR-DASH-02). Its data comes from one
 * request (API-DASH-01), which leaves out what a Guest may not see (BR-GUEST-03). Every KPI and card links to the
 * page where its items are managed; there are no create or edit actions here.
 * `embedded`: inside the project page, which already has the project's header.
 */
export function ProjectDashboard({
  projectKey,
  embedded = false,
}: {
  projectKey: string;
  embedded?: boolean;
}) {
  const project = useProject(projectKey);
  const { sees } = useProjectAccess(project.data);
  const shared = !!project.data && sees('dashboard');
  const dashboard = useDashboard(projectKey, shared);

  if (project.isError) return <Alert>{errorText(project.error)}</Alert>;
  const header = !embedded && project.data && (
    <PageHeader title="Dashboard" description={`${project.data.name} · ${project.data.key}`} />
  );
  if (project.data && !shared) {
    return (
      <>
        {header}
        <EmptyState title="Dashboard not shared">{msg('MSG-GUEST-01')}</EmptyState>
      </>
    );
  }
  return (
    <>
      {header}
      {!embedded && project.data?.archivedAt && (
        <p
          role="status"
          className="mb-4 rounded-lg bg-warning-tint px-4 py-2 text-warning-foreground"
        >
          {msg('MSG-PROJECT-08')}
        </p>
      )}
      {dashboard.isError ? (
        <Alert>{errorText(dashboard.error)}</Alert>
      ) : dashboard.data && project.data ? (
        <DashboardBody project={project.data} data={dashboard.data} />
      ) : (
        <DashboardSkeleton />
      )}
    </>
  );
}

/** Loading: placeholders only, never an empty-state text before the data has arrived. */
function DashboardSkeleton() {
  const block = 'animate-pulse rounded-[var(--radius)] bg-muted';
  return (
    <div aria-busy="true" aria-label="Loading dashboard">
      <div className="mb-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }, (_, i) => (
          <div key={i} className={cn(block, 'h-24')} />
        ))}
      </div>
      <div className="grid gap-5 lg:grid-cols-3">
        <div className={cn(block, 'h-48 lg:col-span-2')} />
        <div className={cn(block, 'h-48')} />
      </div>
    </div>
  );
}

function DashboardBody({ project, data }: { project: Project; data: Dashboard }) {
  const base = `/projects/${project.key}`;
  const releasesPage = `${base}/releases`;
  const sees = (area: DashboardArea) => data.areas.includes(area);
  const { release, sprint, deadlines = [], team, activity = [] } = data;
  const overdue = deadlines.filter((d) => d.days < 0).length;

  const releaseCard = sees('releases') && (
    <Card title="Release" actions={<CardLink to={releasesPage}>All releases</CardLink>}>
      {release ? <ReleaseDetails release={release} /> : <Empty>{msg('MSG-DASH-01')}</Empty>}
    </Card>
  );
  const sprintCard = sees('releases') && (
    <Card
      title="Current sprint"
      actions={<CardLink to={releasesPage}>Releases & sprints</CardLink>}
    >
      {sprint ? (
        <div className="flex flex-col gap-2">
          <span className="text-lg font-semibold">{sprint.name}</span>
          {sprint.goal && <p>{sprint.goal}</p>}
          <p className="text-muted-foreground">
            {formatDate(sprint.startDate)} – {formatDate(sprint.endDate)}
          </p>
          <p className={cn('font-semibold', sprint.daysLeft < 0 && 'text-destructive')}>
            {leftInSprint(sprint.daysLeft)}
          </p>
        </div>
      ) : (
        <Empty>{msg('MSG-DASH-02')}</Empty>
      )}
    </Card>
  );
  const deadlinesCard = sees('releases') && (
    <Card title="Deadlines" actions={<CardLink to={releasesPage}>Releases & sprints</CardLink>}>
      {deadlines.length ? (
        <ul aria-label="Deadlines" className="flex flex-col gap-3">
          {deadlines.map((d) => (
            <DeadlineRow key={`${d.kind}-${d.id}`} deadline={d} />
          ))}
        </ul>
      ) : (
        <Empty>No deadlines in the next 14 days</Empty>
      )}
    </Card>
  );
  const teamCard = sees('members') && team && (
    <Card title="Team" actions={<CardLink to={`${base}/members`}>Members</CardLink>}>
      <ul className="flex flex-col gap-2 border-b pb-3">
        <Count label={ACCESS_LABELS.PROJECT_ADMIN} value={team.byAccess.PROJECT_ADMIN ?? 0} />
        <Count label={ACCESS_LABELS.MEMBER} value={team.byAccess.MEMBER ?? 0} />
        {!!team.byAccess.GUEST && <Count label={ACCESS_LABELS.GUEST} value={team.byAccess.GUEST} />}
      </ul>
      <ul aria-label="Members per job title" className="mt-3 grid gap-x-6 gap-y-2 sm:grid-cols-2">
        {team.byJobTitle.map(({ jobTitle, count }) => (
          <Count
            key={jobTitle ?? 'none'}
            muted
            label={jobTitle ? JOB_TITLE_NAMES[jobTitle] : 'No job title'}
            value={count}
          />
        ))}
      </ul>
    </Card>
  );
  const activityCard = sees('activity') && (
    <Card title="Recent activity" actions={<CardLink to={`${base}/activity`}>Full log</CardLink>}>
      {activity.length ? (
        <ActivityList compact entries={activity} label="Recent activity" />
      ) : (
        <Empty>No activity yet</Empty>
      )}
    </Card>
  );

  return (
    <>
      <div className="mb-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {sees('releases') && (
          <>
            <KpiLink
              to={releasesPage}
              label="Release in focus"
              value={release?.name ?? '—'}
              hint={
                !release
                  ? msg('MSG-DASH-01')
                  : release.daysToTarget === null
                    ? 'No target date'
                    : toTarget(release.daysToTarget)
              }
              tone={
                release?.daysToTarget != null && release.daysToTarget < 0 ? 'danger' : 'neutral'
              }
            />
            <KpiLink
              to={releasesPage}
              label="Current sprint"
              value={sprint?.name ?? '—'}
              hint={sprint ? leftInSprint(sprint.daysLeft) : msg('MSG-DASH-02')}
              tone={sprint && sprint.daysLeft < 0 ? 'danger' : 'neutral'}
            />
            <KpiLink
              mono
              to={releasesPage}
              label="Deadlines, 14 days"
              value={deadlines.length}
              hint={overdue ? `${overdue} overdue` : 'None overdue'}
              tone={overdue ? 'danger' : 'neutral'}
            />
          </>
        )}
        {sees('members') && team && (
          <KpiLink
            mono
            to={`${base}/members`}
            label="Members"
            value={team.total}
            hint={plural(team.byAccess.PROJECT_ADMIN ?? 0, 'project admin')}
          />
        )}
      </div>

      {/* From 1024 px: Release | Current sprint, then Deadlines + Team | Recent activity (DOM order = small-screen order). */}
      <div className="grid items-start gap-5 lg:grid-cols-3">
        {releaseCard && <div className="lg:col-span-2">{releaseCard}</div>}
        {sprintCard}
        {(deadlinesCard || teamCard) && (
          <div className="grid items-start gap-5 md:grid-cols-2 lg:col-span-2">
            {deadlinesCard}
            {teamCard}
          </div>
        )}
        {activityCard}
      </div>
    </>
  );
}

function ReleaseDetails({ release }: { release: NonNullable<Dashboard['release']> }) {
  const done = release.sprints.filter((m) => m.status === 'COMPLETED').length;
  const total = release.sprints.length;
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-3">
        <span className="text-lg font-semibold">{release.name}</span>
        <Badge tone={statusTone[release.status]}>{statusLabel(release.status)}</Badge>
        <span className="text-muted-foreground">
          {release.startDate ? formatDate(release.startDate) : 'No start'} –{' '}
          {release.targetDate ? formatDate(release.targetDate) : 'No target'}
        </span>
      </div>
      {total ? (
        <>
          <div>
            <div className="mb-1.5 flex justify-between text-sm">
              <span>Sprints completed</span>
              <span className="font-mono font-semibold">
                {done}/{total}
              </span>
            </div>
            <ProgressBar label="Sprints completed" value={(done / total) * 100} />
          </div>
          <ol aria-label={`Sprints of ${release.name}`} className="flex flex-wrap gap-2">
            {release.sprints.map((m) => (
              <li key={m.id}>
                <Badge tone={statusTone[m.status]}>
                  {m.name} · {statusLabel(m.status)}
                </Badge>
              </li>
            ))}
          </ol>
        </>
      ) : (
        <Empty>No sprints in this release yet</Empty>
      )}
    </div>
  );
}

function DeadlineRow({ deadline: d }: { deadline: Deadline }) {
  return (
    <li className="flex items-start justify-between gap-3">
      <span>{d.kind === 'RELEASE_TARGET' ? `Release ${d.name} target` : `${d.name} ends`}</span>
      <span className="flex flex-col items-end text-sm">
        <span className="text-muted-foreground">{formatDate(d.date)}</span>
        <span className={cn('font-medium', d.days < 0 && 'text-destructive')}>
          {whenDue(d.days)}
        </span>
      </span>
    </li>
  );
}

function KpiLink({
  to,
  label,
  value,
  hint,
  ...rest
}: { to: string; label: string; value: string | number; hint: string } & Omit<
  Parameters<typeof KpiCard>[0],
  'label' | 'value' | 'hint'
>) {
  return (
    <Link
      to={to}
      aria-label={`${label}: ${value}, ${hint}`}
      className="rounded-[var(--radius)] transition-shadow hover:shadow-md focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
    >
      <KpiCard label={label} value={value} hint={hint} {...rest} />
    </Link>
  );
}

function Count({ label, value, muted = false }: { label: string; value: number; muted?: boolean }) {
  return (
    <li className={cn('flex justify-between gap-3', muted && 'text-muted-foreground')}>
      <span>{label}</span>
      <span className={cn('font-mono', !muted && 'font-semibold')}>{value}</span>
    </li>
  );
}

function Empty({ children }: { children: ReactNode }) {
  return <p className="text-muted-foreground">{children}</p>;
}

function CardLink({ to, children }: { to: string; children: string }) {
  return (
    <Link to={to} className="text-sm font-semibold text-primary-tint-foreground hover:underline">
      {children}
    </Link>
  );
}

/** "/" without any project to show. */
export function NoProjectDashboard() {
  return (
    <>
      <PageHeader title="Dashboard" />
      <EmptyState title="No projects yet">{msg('MSG-ADMIN-10')}</EmptyState>
    </>
  );
}

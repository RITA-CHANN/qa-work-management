import { Link } from 'react-router';
import {
  addDays,
  daysBetween,
  msg,
  type GuestArea,
  todayIso,
  type Member,
  type Milestone,
  type Project,
  type Release,
} from '@qawm/shared';
import { EmptyState } from '@/components/EmptyState';
import { PageHeader } from '@/components/PageHeader';
import { Alert } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Card, KpiCard, ProgressBar } from '@/components/ui/card';
import { ActivityList } from '@/features/projects/ActivityList';
import {
  useActivity,
  useMembers,
  useMilestones,
  useProject,
  useReleases,
} from '@/features/projects/api';
import { useProjectAccess } from '@/features/projects/access';
import { ACCESS_LABELS, JOB_TITLE_NAMES } from '@/features/projects/labels';
import { timeLeft } from '@/features/projects/milestone-time';
import { cn } from '@/lib/utils';
import { errorText } from '@/features/projects/server-error';

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

/** "N days to target" / "Overdue by N days" for a release target date (BR-DASH-03). */
function toTarget(targetDate: string, today = todayIso()) {
  const days = daysBetween(today, targetDate);
  if (days < 0) return `Overdue by ${-days} ${-days === 1 ? 'day' : 'days'}`;
  return `${days} ${days === 1 ? 'day' : 'days'} to target`;
}

/** BR-DASH-03: the Active release, else the next Planned one. */
function focusRelease(releases: Release[]) {
  return (
    releases.find((r) => r.status === 'ACTIVE') ??
    releases
      .filter((r) => r.status === 'PLANNED')
      .sort((a, b) => (a.startDate ?? '9999').localeCompare(b.startDate ?? '9999'))[0]
  );
}

/** BR-DASH-05: release targets and sprint ends in the next 14 days, soonest first. */
function deadlines(releases: Release[], milestones: Milestone[], today = todayIso()) {
  const until = addDays(today, 14);
  const inWindow = (date: string | null) => !!date && date >= today && date <= until;
  return [
    ...releases
      .filter((r) => r.status !== 'RELEASED' && inWindow(r.targetDate))
      .map((r) => ({ id: r.id, date: r.targetDate!, label: `Release ${r.name} target` })),
    ...milestones
      .filter((m) => m.status !== 'COMPLETED' && inWindow(m.endDate))
      .map((m) => ({ id: m.id, date: m.endDate, label: `${m.name} ends` })),
  ].sort((a, b) => a.date.localeCompare(b.date));
}

/**
 * SCR-DASH-01 Project dashboard: one project, monitoring only (BR-DASH-01, BR-DASH-02). Every card links
 * to the page where its items are managed; there are no create or edit actions here. A Guest sees only the
 * cards of areas switched on for Guests (BR-GUEST-03), and nothing is fetched for the others.
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
  const ready = !!project.data;
  const releases = useReleases(projectKey, ready && sees('releases'));
  const milestones = useMilestones(projectKey, ready && sees('releases'));
  const members = useMembers(projectKey, ready && sees('members'));
  const activity = useActivity(projectKey, 10, ready && sees('activity'));

  if (project.isError) return <Alert>{errorText(project.error)}</Alert>;
  if (project.isPending) {
    return (
      <div aria-busy="true" className="grid gap-4 md:grid-cols-4">
        {Array.from({ length: 4 }, (_, i) => (
          <div key={i} className="h-24 animate-pulse rounded-[var(--radius)] bg-muted" />
        ))}
      </div>
    );
  }
  if (!sees('dashboard')) {
    return (
      <>
        {!embedded && (
          <PageHeader
            title="Dashboard"
            description={`${project.data.name} · ${project.data.key}`}
          />
        )}
        <EmptyState title="Dashboard not shared">{msg('MSG-GUEST-01')}</EmptyState>
      </>
    );
  }
  return (
    <DashboardBody
      embedded={embedded}
      sees={sees}
      project={project.data}
      releases={releases.data ?? []}
      milestones={milestones.data ?? []}
      members={members.data ?? []}
      activity={activity.data?.pages.flatMap((page) => page.data).slice(0, 10) ?? []}
    />
  );
}

function DashboardBody({
  embedded,
  sees,
  project,
  releases,
  milestones,
  members,
  activity,
}: {
  embedded: boolean;
  sees: (area: GuestArea) => boolean;
  project: Project;
  releases: Release[];
  milestones: Milestone[];
  members: Member[];
  activity: Parameters<typeof ActivityList>[0]['entries'];
}) {
  const base = `/projects/${project.key}`;
  const release = focusRelease(releases);
  const releaseSprints = release ? milestones.filter((m) => m.releaseId === release.id) : [];
  const doneSprints = releaseSprints.filter((m) => m.status === 'COMPLETED').length;
  const sprint = milestones.find((m) => m.status === 'ACTIVE');
  const upcoming = deadlines(releases, milestones);
  const countOf = (access: Member['access']) => members.filter((m) => m.access === access).length;
  const admins = countOf('PROJECT_ADMIN');
  const guests = countOf('GUEST');
  const titleCounts = Object.entries(
    members.reduce<Record<string, number>>((acc, m) => {
      const title = m.jobTitle ? JOB_TITLE_NAMES[m.jobTitle] : 'No job title';
      acc[title] = (acc[title] ?? 0) + 1;
      return acc;
    }, {}),
  ).sort(([a], [b]) => a.localeCompare(b));

  return (
    <>
      {!embedded && (
        <PageHeader title="Dashboard" description={`${project.name} · ${project.key}`} />
      )}
      {!embedded && project.archivedAt && (
        <p
          role="status"
          className="mb-4 rounded-lg bg-warning-tint px-4 py-2 text-warning-foreground"
        >
          {msg('MSG-PROJECT-08')}
        </p>
      )}

      <div className="mb-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {sees('releases') && (
          <>
            <KpiCard
              label="Release in focus"
              value={release?.name ?? '—'}
              hint={release ? statusLabel(release.status) : msg('MSG-DASH-01')}
            />
            <KpiCard
              label="Release target"
              value={release?.targetDate ? formatDate(release.targetDate) : '—'}
              hint={release?.targetDate ? toTarget(release.targetDate) : 'No target date'}
              tone={
                release?.targetDate && daysBetween(todayIso(), release.targetDate) < 0
                  ? 'danger'
                  : 'neutral'
              }
            />
            <KpiCard
              label="Current sprint"
              value={sprint?.name ?? '—'}
              hint={sprint ? timeLeft(sprint.endDate) : msg('MSG-DASH-02')}
              tone={sprint && daysBetween(todayIso(), sprint.endDate) < 0 ? 'warning' : 'neutral'}
            />
          </>
        )}
        {sees('members') && (
          <KpiCard
            mono
            label="Members"
            value={members.length}
            hint={`${admins} ${admins === 1 ? 'project admin' : 'project admins'}`}
          />
        )}
      </div>

      <div className="grid items-start gap-5 lg:grid-cols-3">
        {sees('releases') && (
          <>
            <Card
              title="Release"
              className="lg:col-span-2"
              actions={<CardLink to={`${base}/releases`}>All releases</CardLink>}
            >
              {release ? (
                <div className="flex flex-col gap-4">
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="text-lg font-semibold">{release.name}</span>
                    <Badge tone={statusTone[release.status]}>{statusLabel(release.status)}</Badge>
                    <span className="text-muted-foreground">
                      {release.startDate ? formatDate(release.startDate) : 'No start'} –{' '}
                      {release.targetDate ? formatDate(release.targetDate) : 'No target'}
                    </span>
                  </div>
                  <div>
                    <div className="mb-1.5 flex justify-between text-sm">
                      <span>Sprints completed</span>
                      <span className="font-mono font-semibold">
                        {doneSprints}/{releaseSprints.length}
                      </span>
                    </div>
                    <ProgressBar
                      label="Sprints completed"
                      value={
                        releaseSprints.length ? (doneSprints / releaseSprints.length) * 100 : 0
                      }
                    />
                  </div>
                  {releaseSprints.length > 0 && (
                    <ol aria-label={`Sprints of ${release.name}`} className="flex flex-wrap gap-2">
                      {releaseSprints.map((m) => (
                        <li key={m.id}>
                          <Badge tone={statusTone[m.status]}>
                            {m.name} · {statusLabel(m.status)}
                          </Badge>
                        </li>
                      ))}
                    </ol>
                  )}
                </div>
              ) : (
                <p className="text-muted-foreground">{msg('MSG-DASH-01')}</p>
              )}
            </Card>

            <Card title="Current sprint">
              {sprint ? (
                <div className="flex flex-col gap-2">
                  <span className="text-lg font-semibold">{sprint.name}</span>
                  {sprint.goal && <p>{sprint.goal}</p>}
                  <p className="text-muted-foreground">
                    {formatDate(sprint.startDate)} – {formatDate(sprint.endDate)}
                  </p>
                  <p className="font-semibold">{timeLeft(sprint.endDate)}</p>
                </div>
              ) : (
                <p className="text-muted-foreground">{msg('MSG-DASH-02')}</p>
              )}
            </Card>

            <Card title="Deadlines (next 14 days)">
              {upcoming.length ? (
                <ul className="flex flex-col gap-2">
                  {upcoming.map((d) => (
                    <li key={d.id} className="flex justify-between gap-3">
                      <span>{d.label}</span>
                      <span className="text-muted-foreground">{formatDate(d.date)}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-muted-foreground">No deadlines in the next 14 days</p>
              )}
            </Card>
          </>
        )}

        {sees('members') && (
          <Card title="Team" actions={<CardLink to={`${base}/members`}>Members</CardLink>}>
            <ul className="flex flex-col gap-2">
              <li className="flex justify-between">
                <span>{ACCESS_LABELS.PROJECT_ADMIN}</span>
                <span className="font-mono font-semibold">{admins}</span>
              </li>
              <li className={cn('flex justify-between', !guests && 'border-b pb-2')}>
                <span>{ACCESS_LABELS.MEMBER}</span>
                <span className="font-mono font-semibold">{countOf('MEMBER')}</span>
              </li>
              {guests > 0 && (
                <li className="flex justify-between border-b pb-2">
                  <span>{ACCESS_LABELS.GUEST}</span>
                  <span className="font-mono font-semibold">{guests}</span>
                </li>
              )}
              {titleCounts.map(([title, count]) => (
                <li key={title} className="flex justify-between text-muted-foreground">
                  <span>{title}</span>
                  <span className="font-mono">{count}</span>
                </li>
              ))}
            </ul>
          </Card>
        )}

        {sees('activity') && (
          <Card
            title="Recent activity"
            actions={<CardLink to={`${base}/activity`}>Full log</CardLink>}
          >
            {activity.length ? (
              <ActivityList entries={activity} label="Recent activity" />
            ) : (
              <p className="text-muted-foreground">No activity yet</p>
            )}
          </Card>
        )}
      </div>
    </>
  );
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

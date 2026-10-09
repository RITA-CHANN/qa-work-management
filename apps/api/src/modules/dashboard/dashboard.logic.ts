import {
  addDays,
  daysBetween,
  DEADLINE_WINDOW_DAYS,
  PROJECT_ACCESS,
  type Deadline,
  type JobTitle,
  type MilestoneStatus,
  type ProjectAccess,
  type ProjectDashboard,
  type ReleaseStatus,
} from '@qawm/shared';

/** Pure parts of API-DASH-01, on plain `YYYY-MM-DD` dates so they can be unit tested without a database. */

type ReleaseLike = {
  id: string;
  name: string;
  status: ReleaseStatus;
  startDate: string | null;
  targetDate: string | null;
};
type SprintLike = { id: string; name: string; status: MilestoneStatus; endDate: string };

/** BR-DASH-03: the Active release, else the Planned one with the earliest start date (no start date last). */
export function focusRelease<R extends ReleaseLike>(releases: R[]): R | undefined {
  return (
    releases.find((r) => r.status === 'ACTIVE') ??
    releases
      .filter((r) => r.status === 'PLANNED')
      .sort((a, b) => (a.startDate ?? '9999-12-31').localeCompare(b.startDate ?? '9999-12-31'))[0]
  );
}

/**
 * BR-DASH-05: release targets (not Released) and sprint ends (not Completed) that are overdue or within the next
 * DEADLINE_WINDOW_DAYS days. Overdue first, oldest first; then soonest first. Ties: releases before sprints, then name.
 */
export function buildDeadlines(
  releases: ReleaseLike[],
  sprints: SprintLike[],
  asOf: string,
): Deadline[] {
  const until = addDays(asOf, DEADLINE_WINDOW_DAYS);
  const items: Deadline[] = [
    ...releases
      .filter((r) => r.status !== 'RELEASED' && r.targetDate && r.targetDate <= until)
      .map((r) => ({
        kind: 'RELEASE_TARGET' as const,
        id: r.id,
        name: r.name,
        date: r.targetDate!,
      })),
    ...sprints
      .filter((m) => m.status !== 'COMPLETED' && m.endDate <= until)
      .map((m) => ({ kind: 'SPRINT_END' as const, id: m.id, name: m.name, date: m.endDate })),
  ].map((d) => ({ ...d, days: daysBetween(asOf, d.date) }));
  return items.sort(
    (a, b) =>
      a.date.localeCompare(b.date) || a.kind.localeCompare(b.kind) || a.name.localeCompare(b.name),
  );
}

/** BR-DASH-06: counts per access level (every level present, 0 when none) and per job title (zeros left out). */
export function teamCounts(
  members: { access: ProjectAccess; jobTitle: JobTitle | null }[],
): NonNullable<ProjectDashboard['team']> {
  const byAccess = Object.fromEntries(PROJECT_ACCESS.map((a) => [a, 0])) as Record<
    ProjectAccess,
    number
  >;
  const titles = new Map<JobTitle | null, number>();
  for (const m of members) {
    byAccess[m.access] += 1;
    titles.set(m.jobTitle, (titles.get(m.jobTitle) ?? 0) + 1);
  }
  const byJobTitle = [...titles]
    .map(([jobTitle, count]) => ({ jobTitle, count }))
    // By key; "no job title" last.
    .sort((a, b) =>
      a.jobTitle === null ? 1 : b.jobTitle === null ? -1 : a.jobTitle.localeCompare(b.jobTitle),
    );
  return { total: members.length, byAccess, byJobTitle };
}

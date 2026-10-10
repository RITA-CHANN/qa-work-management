import { describe, expect, it } from 'vitest';
import { buildDeadlines, focusRelease, teamCounts } from './dashboard.logic';

const release = (
  id: string,
  status: 'PLANNED' | 'ACTIVE' | 'RELEASED',
  startDate: string | null,
  targetDate: string | null = null,
) => ({
  id,
  name: id,
  status,
  startDate,
  targetDate,
});
const sprint = (id: string, status: 'PLANNED' | 'ACTIVE' | 'COMPLETED', endDate: string) => ({
  id,
  name: id,
  status,
  endDate,
});

describe('focusRelease (BR-DASH-03)', () => {
  it('takes the Active release', () => {
    expect(
      focusRelease([release('a', 'PLANNED', '2026-01-01'), release('b', 'ACTIVE', null)])?.id,
    ).toBe('b');
  });

  it('else the Planned one starting first, one without a start date last', () => {
    const releases = [
      release('none', 'PLANNED', null),
      release('late', 'PLANNED', '2026-12-01'),
      release('early', 'PLANNED', '2026-11-01'),
      release('old', 'RELEASED', '2026-01-01'),
    ];
    expect(focusRelease(releases)?.id).toBe('early');
  });

  it('is undefined when only Released releases exist', () => {
    expect(focusRelease([release('old', 'RELEASED', '2026-01-01')])).toBeUndefined();
  });
});

describe('buildDeadlines (BR-DASH-05)', () => {
  const asOf = '2026-10-09';

  it('lists overdue items first, then the next 14 days, and nothing later', () => {
    const deadlines = buildDeadlines(
      [release('R1', 'ACTIVE', null, '2026-10-14'), release('R2', 'PLANNED', null, '2026-10-24')],
      [
        sprint('S-late', 'PLANNED', '2026-10-07'),
        sprint('S-today', 'ACTIVE', '2026-10-09'),
        sprint('S-14', 'PLANNED', '2026-10-23'),
      ],
      asOf,
    );
    expect(deadlines.map((d) => [d.name, d.days])).toEqual([
      ['S-late', -2],
      ['S-today', 0],
      ['R1', 5],
      ['S-14', 14],
    ]);
  });

  it('leaves out Released releases and Completed sprints, even when overdue', () => {
    const deadlines = buildDeadlines(
      [release('R', 'RELEASED', null, '2026-10-01'), release('N', 'PLANNED', null, null)],
      [sprint('S', 'COMPLETED', '2026-10-01')],
      asOf,
    );
    expect(deadlines).toEqual([]);
  });

  it('puts a release target before a sprint end on the same day', () => {
    const deadlines = buildDeadlines(
      [release('R', 'ACTIVE', null, '2026-10-12')],
      [sprint('S', 'ACTIVE', '2026-10-12')],
      asOf,
    );
    expect(deadlines.map((d) => d.kind)).toEqual(['RELEASE_TARGET', 'SPRINT_END']);
  });
});

describe('teamCounts (BR-DASH-06)', () => {
  it('counts every access level and each job title, no job title last', () => {
    const team = teamCounts([
      { access: 'PROJECT_ADMIN', jobTitle: 'PM' },
      { access: 'MEMBER', jobTitle: 'QAE' },
      { access: 'MEMBER', jobTitle: null },
      { access: 'MEMBER', jobTitle: 'QAE' },
    ]);
    expect(team).toEqual({
      total: 4,
      byAccess: { PROJECT_ADMIN: 1, MEMBER: 3, GUEST: 0 },
      byJobTitle: [
        { jobTitle: 'PM', count: 1 },
        { jobTitle: 'QAE', count: 2 },
        { jobTitle: null, count: 1 },
      ],
    });
  });
});

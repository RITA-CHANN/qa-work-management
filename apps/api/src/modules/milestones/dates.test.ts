import { addDays, inclusiveDays, milestoneCreateSchema, milestoneLengthOk } from '@qawm/shared';
import { describe, expect, it } from 'vitest';
import { assertInsideRelease, assertNoOverlap } from './dates';

const release = { name: '2.5', startDate: '2026-11-01', targetDate: '2026-11-30' };
const range = (startDate: string, endDate: string) => ({ startDate, endDate });

describe('milestone length (BR-PROJECT-28)', () => {
  it.each([
    ['2026-11-01', '2026-11-01', 1, true],
    ['2026-11-01', '2026-11-28', 28, true],
    ['2026-11-01', '2026-11-29', 29, false],
    ['2026-11-02', '2026-11-01', 0, false],
  ])('%s → %s is %i days, ok: %s', (start, end, days, ok) => {
    expect(inclusiveDays(start, end)).toBe(days);
    expect(milestoneLengthOk(start, end, 28)).toBe(ok);
  });

  it('counts across a month and a daylight-saving change the same way', () => {
    expect(inclusiveDays('2026-10-20', '2026-11-02')).toBe(14);
    expect(addDays('2026-10-31', 1)).toBe('2026-11-01');
  });

  it('gives MSG-PROJECT-24 under the end date for a 29-day sprint', () => {
    const result = milestoneCreateSchema.safeParse({
      releaseId: 'r',
      name: 'Sprint 6',
      ...range('2026-11-01', '2026-11-29'),
    });
    expect(result.error?.issues[0]).toMatchObject({
      path: ['endDate'],
      message: 'A milestone needs a start and end date, 1–28 days long',
    });
  });
});

describe('inside the release (BR-PROJECT-29)', () => {
  it('accepts the release boundaries themselves', () => {
    expect(() => assertInsideRelease(range('2026-11-01', '2026-11-28'), release)).not.toThrow();
  });

  it.each([range('2026-10-31', '2026-11-05'), range('2026-11-20', '2026-12-01')])(
    'refuses %o, one day outside',
    (dates) => {
      expect(() => assertInsideRelease(dates, release)).toThrow(
        expect.objectContaining({ code: 'MILESTONE_OUTSIDE_RELEASE' }),
      );
    },
  );

  it('has nothing to check when the release has no dates', () => {
    const open = { name: '3.0', startDate: null, targetDate: null };
    expect(() => assertInsideRelease(range('2020-01-01', '2020-01-02'), open)).not.toThrow();
  });
});

describe('no overlap (BR-PROJECT-30)', () => {
  const sprint5 = { name: 'Sprint 5', ...range('2026-11-01', '2026-11-14') };

  it('refuses sharing exactly one day', () => {
    expect(() => assertNoOverlap(range('2026-11-14', '2026-11-27'), [sprint5])).toThrow(
      expect.objectContaining({
        code: 'MILESTONE_OVERLAP',
        message: 'Overlaps milestone Sprint 5 (2026-11-01 – 2026-11-14)',
      }),
    );
  });

  it('accepts the next day', () => {
    expect(() => assertNoOverlap(range('2026-11-15', '2026-11-28'), [sprint5])).not.toThrow();
  });
});

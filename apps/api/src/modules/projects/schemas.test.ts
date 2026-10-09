import {
  makeMilestoneCreateSchema,
  memberUpdateSchema,
  projectCreateSchema,
  projectUpdateSchema,
  RELEASE_NEXT,
  MILESTONE_NEXT,
  releaseCreateSchema,
} from '@qawm/shared';
import { describe, expect, it } from 'vitest';

const messages = (result: { error?: { issues: { message: string }[] } }) =>
  result.error?.issues.map((issue) => issue.message) ?? [];

describe('project key (BR-PROJECT-02)', () => {
  it.each(['AB', 'QA2', 'ABCDEFGHIJ'])('accepts %s', (key) => {
    expect(projectCreateSchema.safeParse({ key, name: 'Demo' }).success).toBe(true);
  });

  it.each(['1AB', 'A', 'ABCDEFGHIJK', 'AB-1'])('refuses %s with MSG-PROJECT-02', (key) => {
    expect(messages(projectCreateSchema.safeParse({ key, name: 'Demo' }))).toEqual([
      'Key must be 2–10 letters or digits and start with a letter',
    ]);
  });

  it('upper-cases and trims what was typed (AC-PROJECT-04)', () => {
    expect(projectCreateSchema.parse({ key: ' demo ', name: 'Demo' }).key).toBe('DEMO');
  });
});

describe('project name (BR-PROJECT-04)', () => {
  it.each([
    ['ab', false],
    ['abc', true],
    ['a'.repeat(100), true],
    ['a'.repeat(101), false],
    ['     ', false],
  ])('%s → valid: %s', (name, valid) => {
    expect(projectCreateSchema.safeParse({ key: 'DEMO', name }).success).toBe(valid);
  });
});

describe('mass assignment (NFR-PROJECT-04)', () => {
  it.each([{ createdById: 'x' }, { archivedAt: null }, { version: 2 }])(
    'create refuses %o',
    (extra) => {
      expect(projectCreateSchema.safeParse({ key: 'DEMO', name: 'Demo', ...extra }).success).toBe(
        false,
      );
    },
  );

  it('update refuses a key and requires a version', () => {
    expect(projectUpdateSchema.safeParse({ version: 1, key: 'NEW' }).success).toBe(false);
    expect(projectUpdateSchema.safeParse({ name: 'Demo' }).success).toBe(false);
  });

  it('a member role must be one of the 8 roles', () => {
    expect(memberUpdateSchema.safeParse({ role: 'ADMIN' }).success).toBe(false);
  });

  it('a new release has no status', () => {
    expect(releaseCreateSchema.safeParse({ name: '2.6', status: 'ACTIVE' }).success).toBe(false);
  });
});

describe('release dates (BR-PROJECT-15)', () => {
  it('accepts target = start and refuses target before start with MSG-PROJECT-15', () => {
    const day = (startDate: string, targetDate: string) =>
      releaseCreateSchema.safeParse({ name: '2.6', startDate, targetDate });
    expect(day('2026-11-01', '2026-11-01').success).toBe(true);
    expect(messages(day('2026-11-02', '2026-11-01'))).toEqual([
      'Target date must be on or after the start date',
    ]);
  });
});

describe('status moves one step forward only (DD-PROJECT-04)', () => {
  it('releases', () => {
    expect(RELEASE_NEXT).toEqual({ PLANNED: 'ACTIVE', ACTIVE: 'RELEASED' });
  });

  it('milestones', () => {
    expect(MILESTONE_NEXT).toEqual({ PLANNED: 'ACTIVE', ACTIVE: 'COMPLETED' });
  });
});

describe('milestone setting (BR-PROJECT-28)', () => {
  it('a lower maximum shows in the message', () => {
    const schema = makeMilestoneCreateSchema(14);
    const result = schema.safeParse({
      releaseId: 'r',
      name: 'S',
      startDate: '2026-11-01',
      endDate: '2026-11-15',
    });
    expect(messages(result)).toEqual(['A milestone needs a start and end date, 1–14 days long']);
  });
});

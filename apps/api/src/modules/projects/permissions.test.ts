import { can, PROJECT_ACCESS, type ProjectAccess, type ProjectAction } from '@qawm/shared';
import { describe, expect, it } from 'vitest';
import { ForbiddenError } from '../../lib/errors';
import { assertCan, assertNotArchived } from './permissions';

// The permission matrix of docs/requirements/project/README.md (BR-PROJECT-35), written the same way:
// one row per action, one column per access level. NFR-PROJECT-02: every access level × every action.
// A System admin acts as PROJECT_ADMIN (loader.ts); job titles play no part.
//                                ADMIN MEMBER
// prettier-ignore
const MATRIX: Record<ProjectAction, string> = {
  'project:view':    '✅    ✅',
  'project:edit':    '✅    ❌',
  'release:write':   '✅    ❌',
  'milestone:write': '✅    ❌',
  'member:manage':   '✅    ❌',
  'project:archive': '✅    ❌',
  'project:delete':  '✅    ❌',
};

const cases = Object.entries(MATRIX).flatMap(([action, row]) =>
  row
    .split(/\s+/)
    .map(
      (cell, i) =>
        [action as ProjectAction, PROJECT_ACCESS[i] as ProjectAccess, cell === '✅'] as const,
    ),
);

describe('permission matrix', () => {
  it('covers 2 access levels × 7 actions', () => {
    expect(cases).toHaveLength(14);
  });

  it.each(cases)('%s by %s → allowed: %s', (action, access, allowed) => {
    expect(can(access, action)).toBe(allowed);
    if (allowed) expect(() => assertCan(access, action)).not.toThrow();
    else expect(() => assertCan(access, action)).toThrow(ForbiddenError);
  });

  it('refuses everything without access', () => {
    expect(can(null, 'project:view')).toBe(false);
  });
});

describe('assertNotArchived', () => {
  it('lets an active project through and refuses an archived one with 422', () => {
    expect(() => assertNotArchived({ archivedAt: null })).not.toThrow();
    expect(() => assertNotArchived({ archivedAt: new Date() })).toThrow(
      expect.objectContaining({ status: 422, code: 'PROJECT_ARCHIVED' }),
    );
  });
});

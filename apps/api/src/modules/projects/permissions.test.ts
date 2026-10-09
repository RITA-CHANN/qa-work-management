import { can, PROJECT_ROLES, type ProjectAction, type ProjectRole } from '@qawm/shared';
import { describe, expect, it } from 'vitest';
import { ForbiddenError } from '../../lib/errors';
import { assertCan, assertNotArchived } from './permissions';

// The permission matrix of docs/requirements/project/README.md (BR-PROJECT-35), written the same way:
// one row per action, one column per role. NFR-PROJECT-02: every role × every action.
//                                     OWN  PM   QAL  QAE  TL   DEV  STK  VIEW
// prettier-ignore
const MATRIX: Record<ProjectAction, string> = {
  'project:view':        '✅   ✅   ✅   ✅   ✅   ✅   ✅   ✅',
  'project:edit':        '✅   ✅   ✅   ❌   ❌   ❌   ❌   ❌',
  'release:write':       '✅   ✅   ✅   ❌   ❌   ❌   ❌   ❌',
  'milestone:write':     '✅   ✅   ✅   ❌   ✅   ❌   ❌   ❌',
  'member:manage':       '✅   ✅   ✅   ❌   ❌   ❌   ❌   ❌',
  'member:manage-owner': '✅   ❌   ❌   ❌   ❌   ❌   ❌   ❌',
  'project:archive':     '✅   ❌   ❌   ❌   ❌   ❌   ❌   ❌',
  'project:delete':      '✅   ❌   ❌   ❌   ❌   ❌   ❌   ❌',
};

const cases = Object.entries(MATRIX).flatMap(([action, row]) =>
  row
    .split(/\s+/)
    .map(
      (cell, i) =>
        [action as ProjectAction, PROJECT_ROLES[i] as ProjectRole, cell === '✅'] as const,
    ),
);

describe('permission matrix', () => {
  it('covers 8 roles × 8 actions', () => {
    expect(cases).toHaveLength(64);
  });

  it.each(cases)('%s by %s → allowed: %s', (action, role, allowed) => {
    expect(can(role, action)).toBe(allowed);
    if (allowed) expect(() => assertCan(role, action)).not.toThrow();
    else expect(() => assertCan(role, action)).toThrow(ForbiddenError);
  });

  it('refuses everything without a role', () => {
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

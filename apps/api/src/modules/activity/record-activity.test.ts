import { describe, expect, it, vi } from 'vitest';
import type { Tx } from '../../lib/db-types';
import { diff, recordActivity } from './record-activity';
import { summaries } from './summaries';

describe('diff', () => {
  it('keeps only fields whose value changed', () => {
    expect(diff({ name: 'A', description: 'x' }, { name: 'B', description: 'x' })).toEqual({
      name: { from: 'A', to: 'B' },
    });
  });

  it('ignores fields that were not sent, and returns null when nothing changed', () => {
    expect(
      diff({ name: 'A', description: null }, { name: 'A', description: undefined }),
    ).toBeNull();
  });

  it('records clearing a value as a change to null', () => {
    expect(diff({ description: 'x' }, { description: null })).toEqual({
      description: { from: 'x', to: null },
    });
  });
});

describe('summaries', () => {
  it('uses display names for roles and statuses (DD-PROJECT-02)', () => {
    expect(summaries.memberRoleChanged('Minh Lead', 'Linh QA', 'VIEWER', 'QA_ENGINEER')).toBe(
      "Minh Lead changed Linh QA's role from Viewer to QA engineer",
    );
    expect(summaries.releaseStatusChanged('Mai PM', '2.4', 'ACTIVE', 'RELEASED')).toBe(
      'Mai PM moved release 2.4 from Active to Released',
    );
  });
});

describe('recordActivity', () => {
  it('writes through the transaction client it is given (BR-PROJECT-22)', async () => {
    const create = vi.fn().mockResolvedValue({});
    const member = { globalRole: 'USER', memberships: [{ userId: 'u1' }] };
    const tx = {
      activityLog: { create },
      user: { findUnique: vi.fn().mockResolvedValue(member) },
    } as unknown as Tx;
    await recordActivity(tx, {
      projectId: 'p1',
      actorId: 'u1',
      action: 'project.updated',
      entityType: 'project',
      entityId: 'p1',
      summary: 'Ada Admin edited the project',
      changes: { name: { from: 'A', to: 'B' } },
    });
    expect(create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        action: 'project.updated',
        changes: { name: { from: 'A', to: 'B' } },
      }),
    });
  });

  it('fails the transaction when the insert fails, so the change is rolled back too', async () => {
    const tx = { activityLog: { create: vi.fn().mockRejectedValue(new Error('disk full')) } };
    await expect(
      recordActivity(tx as unknown as Tx, {
        projectId: 'p1',
        actorId: 'u1',
        action: 'project.archived',
        entityType: 'project',
        entityId: 'p1',
        summary: 's',
      }),
    ).rejects.toThrow('disk full');
  });

  it('also writes an audit event marked ADMIN when an Admin is not a member (BR-ADMIN-14)', async () => {
    const audit = vi.fn().mockResolvedValue({});
    const tx = {
      activityLog: { create: vi.fn().mockResolvedValue({}) },
      user: { findUnique: vi.fn().mockResolvedValue({ globalRole: 'ADMIN', memberships: [] }) },
      project: { findUnique: vi.fn().mockResolvedValue({ key: 'SHOP' }) },
      auditEvent: { create: audit },
    } as unknown as Tx;
    await recordActivity(tx, {
      projectId: 'p1',
      actorId: 'admin',
      action: 'project.updated',
      entityType: 'project',
      entityId: 'p1',
      summary: 'Ada Admin edited the project',
      changes: { name: { from: 'A', to: 'B' } },
    });
    expect(audit).toHaveBeenCalledWith({
      data: expect.objectContaining({
        actorId: 'admin',
        projectKey: 'SHOP',
        actedAs: 'ADMIN',
        before: { name: 'A' },
        after: { name: 'B' },
      }),
    });
  });
});

import { describe, expect, it } from 'vitest';
import { changeLines } from './activity-changes';

describe('changeLines (BR-PROJECT-20)', () => {
  it('shows access levels and job titles by name', () => {
    expect(
      changeLines({
        entityType: 'member',
        changes: {
          access: { from: 'MEMBER', to: 'PROJECT_ADMIN' },
          jobTitle: { from: 'QAE', to: null },
        },
      }),
    ).toEqual([
      { field: 'access', label: 'Access', from: 'Member', to: 'Project admin' },
      { field: 'jobTitle', label: 'Job title', from: 'QA engineer', to: '—' },
    ]);
  });

  it('uses the status names of the entity type', () => {
    expect(
      changeLines({
        entityType: 'milestone',
        changes: { status: { from: 'ACTIVE', to: 'COMPLETED' } },
      })[0],
    ).toMatchObject({ from: 'Active', to: 'Completed' });
  });

  it('lists Guest areas by name and quotes only free text', () => {
    const lines = changeLines({
      entityType: 'project',
      changes: {
        guestAreas: { from: ['dashboard', 'releases'], to: [] },
        name: { from: 'ShopEase', to: 'ShopEase Web' },
        targetDate: { from: '2026-10-29', to: '2026-12-31' },
      },
    });
    expect(lines).toEqual([
      {
        field: 'guestAreas',
        label: 'Guest can see',
        from: 'Project dashboard, Releases and sprints',
        to: '—',
      },
      { field: 'name', label: 'Name', from: '"ShopEase"', to: '"ShopEase Web"' },
      { field: 'targetDate', label: 'Target date', from: '2026-10-29', to: '2026-12-31' },
    ]);
  });
});

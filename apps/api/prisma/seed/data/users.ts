import type { GlobalRole, UserStatus } from '../../../src/generated/prisma/client';

/** Dev and test only. Documented in docs/database/tables/users.md#seed-data. */
export const SEED_PASSWORD = 'Password123!';

// One user per persona from the Phase 0 architecture. Project roles: data/projects.ts.
export const users: { email: string; name: string; globalRole: GlobalRole; status?: UserStatus }[] =
  [
    { email: 'admin@qawm.test', name: 'Ada Admin', globalRole: 'ADMIN' },
    { email: 'lead@qawm.test', name: 'Minh Lead', globalRole: 'USER' },
    { email: 'linh@qawm.test', name: 'Linh QA', globalRole: 'USER' },
    { email: 'dev@qawm.test', name: 'Dev Nguyen', globalRole: 'USER' },
    { email: 'viewer@qawm.test', name: 'Pat Viewer', globalRole: 'USER' },
    // Only for rate-limit tests, so a blocked email never breaks other tests (DD-AUTH-01).
    { email: 'ratelimit@qawm.test', name: 'Rate Limit', globalRole: 'USER' },
    // Phase 3: with the users above, SHOP has one member per project role.
    { email: 'owner@qawm.test', name: 'Oanh Owner', globalRole: 'USER' },
    { email: 'pm@qawm.test', name: 'Mai PM', globalRole: 'USER' },
    { email: 'teamlead@qawm.test', name: 'Tuan TeamLead', globalRole: 'USER' },
    { email: 'stakeholder@qawm.test', name: 'Sam Stakeholder', globalRole: 'USER' },
    // A user in no project: the empty project list (AC-ADMIN-22).
    { email: 'newbie@qawm.test', name: 'Nora Newbie', globalRole: 'USER' },
    // Phase 3C: a deactivated account (BR-ADMIN-10). Can't sign in.
    {
      email: 'inactive@qawm.test',
      name: 'Hoa Inactive',
      globalRole: 'USER',
      status: 'DEACTIVATED',
    },
  ];

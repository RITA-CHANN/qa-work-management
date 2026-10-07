import type { GlobalRole } from '../../../src/generated/prisma/client';

// One user per persona from the Phase 0 architecture. Project roles arrive in Phase 3.
export const users: { email: string; name: string; globalRole: GlobalRole }[] = [
  { email: 'admin@qawm.test', name: 'Ada Admin', globalRole: 'ADMIN' },
  { email: 'lead@qawm.test', name: 'Minh Lead', globalRole: 'USER' },
  { email: 'linh@qawm.test', name: 'Linh QA', globalRole: 'USER' },
  { email: 'dev@qawm.test', name: 'Dev Nguyen', globalRole: 'USER' },
  { email: 'viewer@qawm.test', name: 'Pat Viewer', globalRole: 'USER' },
];

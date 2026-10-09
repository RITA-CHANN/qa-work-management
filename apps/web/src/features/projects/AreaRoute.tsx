import type { ReactNode } from 'react';
import type { GuestArea } from '@qawm/shared';
import { NotFoundPage } from '@/pages/NotFoundPage';
import { useProjectAccess } from './access';
import { useProjectOutlet } from './project-outlet';

/** A tab of an area switched off for Guests is hidden from them entirely (BR-GUEST-03), like the API's 404. */
export function AreaRoute({ area, children }: { area: GuestArea; children: ReactNode }) {
  const { project } = useProjectOutlet();
  const { sees } = useProjectAccess(project);
  return sees(area) ? children : <NotFoundPage />;
}

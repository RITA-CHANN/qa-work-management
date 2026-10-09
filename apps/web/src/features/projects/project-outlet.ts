import { useOutletContext } from 'react-router';
import type { Project } from '@qawm/shared';

export type ProjectOutletContext = { project: Project };

/** The project of the page, for the tabs rendered inside ProjectLayout. */
export function useProjectOutlet() {
  return useOutletContext<ProjectOutletContext>();
}

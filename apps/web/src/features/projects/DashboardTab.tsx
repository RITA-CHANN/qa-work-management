import { ProjectDashboard } from '@/features/dashboard/ProjectDashboard';
import { useProjectOutlet } from './project-outlet';

/** Dashboard tab of SCR-PROJECT-02: the project dashboard under the project's header (Q-ADMIN-04). */
export function DashboardTab() {
  const { project } = useProjectOutlet();
  return <ProjectDashboard projectKey={project.key} embedded />;
}

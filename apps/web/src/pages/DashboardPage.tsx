import { NoProjectDashboard, ProjectDashboard } from '@/features/dashboard/ProjectDashboard';
import { useCurrentProject } from '@/features/shell/api';

/** "/": the dashboard of the current project (BR-SHELL-04, BR-DASH-01). */
export function DashboardPage() {
  const current = useCurrentProject();
  if (current.isPending) return <p role="status">Loading…</p>;
  if (!current.data) return <NoProjectDashboard />;
  return <ProjectDashboard projectKey={current.data} />;
}

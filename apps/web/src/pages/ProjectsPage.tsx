import { EmptyState } from '@/components/EmptyState';
import { PageHeader } from '@/components/PageHeader';

export function ProjectsPage() {
  return (
    <>
      <PageHeader
        title="Projects"
        description="Projects group releases, requirements, tests and bugs."
      />
      <EmptyState title="No projects yet">Project management arrives in Phase 3.</EmptyState>
    </>
  );
}

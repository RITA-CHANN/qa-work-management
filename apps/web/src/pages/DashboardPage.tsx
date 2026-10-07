import { EmptyState } from '@/components/EmptyState';
import { PageHeader } from '@/components/PageHeader';

export function DashboardPage() {
  return (
    <>
      <PageHeader title="Dashboard" description="Your QA overview across projects and releases." />
      <EmptyState title="Nothing to show yet">
        Metrics appear here once projects, test runs and bugs exist (Phase 7).
      </EmptyState>
    </>
  );
}

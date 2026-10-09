import { Link } from 'react-router';
import { useActivity } from './api';
import { ActivityList } from './ActivityList';
import { useProjectOutlet } from './project-outlet';

/** Overview tab of SCR-PROJECT-02: description, key facts, the 5 newest activity entries. */
export function OverviewTab() {
  const { project } = useProjectOutlet();
  const recent = useActivity(project.key, 5);
  const entries = recent.data?.pages[0]?.data ?? [];

  return (
    <div className="flex flex-col gap-6">
      <section aria-labelledby="overview-heading" className="flex flex-col gap-2">
        <h2 id="overview-heading" className="sr-only">
          Overview
        </h2>
        <p className="whitespace-pre-line">
          {project.description ?? <span className="text-muted-foreground">No description.</span>}
        </p>
        <p className="text-sm text-muted-foreground">
          Members {project.memberCount} · Active release {project.activeRelease?.name ?? '—'} ·
          Created by {project.createdBy.name}, {project.createdAt.slice(0, 10)}
        </p>
      </section>
      <section aria-labelledby="recent-heading">
        <div className="mb-2 flex items-center justify-between">
          <h2 id="recent-heading" className="text-lg font-semibold">
            Recent activity
          </h2>
          <Link to="activity" className="text-sm underline-offset-4 hover:underline">
            View all →
          </Link>
        </div>
        <ActivityList entries={entries} label="Recent activity" />
      </section>
    </div>
  );
}

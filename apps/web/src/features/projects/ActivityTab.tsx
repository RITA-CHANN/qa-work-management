import { useEffect, useRef, useState } from 'react';
import { msg } from '@qawm/shared';
import { Alert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { useActivity } from './api';
import { ActivityList } from './ActivityList';
import { useProjectOutlet } from './project-outlet';

/** SCR-PROJECT-05: the activity log, 20 per page, newest first; "Load more" for the next page. */
export function ActivityTab() {
  const { project } = useProjectOutlet();
  const activity = useActivity(project.key);
  const listRef = useRef<HTMLDivElement>(null);
  const [loaded, setLoaded] = useState<string | null>(null);
  const pages = activity.data?.pages ?? [];
  const entries = pages.flatMap((page) => page.data);
  const lastPageSize = pages.at(-1)?.data.length ?? 0;

  // After "Load more", focus the first new entry and say how many arrived.
  const previousCount = useRef(0);
  useEffect(() => {
    if (pages.length > 1 && entries.length > previousCount.current) {
      const items = listRef.current?.querySelectorAll<HTMLElement>('ol > li');
      items?.[previousCount.current]?.focus();
      setLoaded(`${lastPageSize} more ${lastPageSize === 1 ? 'entry' : 'entries'} loaded`);
    }
    previousCount.current = entries.length;
  }, [entries.length, pages.length, lastPageSize]);

  if (activity.isError) {
    return (
      <Alert>
        {msg('MSG-COMMON-01')}
        <Button size="sm" variant="outline" onClick={() => void activity.refetch()}>
          Try again
        </Button>
      </Alert>
    );
  }

  return (
    <section aria-labelledby="activity-heading">
      <h2 id="activity-heading" className="mb-2 text-lg font-semibold">
        Activity
      </h2>
      <div ref={listRef} aria-busy={activity.isPending || activity.isFetchingNextPage}>
        <ActivityList entries={entries} label="Activity" />
      </div>
      {activity.hasNextPage && (
        <div className="mt-4 flex justify-center">
          <Button
            variant="outline"
            onClick={() => void activity.fetchNextPage()}
            disabled={activity.isFetchingNextPage}
          >
            Load more
          </Button>
        </div>
      )}
      <p role="status" className="sr-only">
        {loaded}
      </p>
    </section>
  );
}

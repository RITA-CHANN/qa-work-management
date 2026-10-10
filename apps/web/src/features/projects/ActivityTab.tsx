import { useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router';
import { ACTIVITY_ENTITY_TYPES, msg, type ActivityEntityType } from '@qawm/shared';
import { Alert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { SelectField, TextField } from '@/components/ui/field';
import { useActivity, useActivityActors, type ActivityFilters } from './api';
import { ActivityByDay } from './ActivityList';
import { useProjectOutlet } from './project-outlet';

const TYPE_LABELS: Record<ActivityEntityType, string> = {
  project: 'Project',
  member: 'Members',
  release: 'Releases',
  milestone: 'Milestones',
};

const DAY = /^\d{4}-\d{2}-\d{2}$/;

/** Start of a local day as an ISO instant; `plusDays` 1 gives the start of the next day. */
function dayStart(day: string, plusDays = 0): string {
  const [year, month, date] = day.split('-').map(Number);
  return new Date(year!, month! - 1, date! + plusDays).toISOString();
}

/**
 * SCR-PROJECT-05: the activity log, 20 per page, newest first, grouped by day; "Load more" for the next page.
 * Filters by type, person and date range live in the address (BR-PROJECT-38).
 */
export function ActivityTab() {
  const { project } = useProjectOutlet();
  const [params, setParams] = useSearchParams();
  const actors = useActivityActors(project.key);

  // Unknown values in the address are ignored, so the field shows its default.
  const typeParam = params.get('type');
  const type = (ACTIVITY_ENTITY_TYPES as readonly string[]).includes(typeParam ?? '')
    ? (typeParam as ActivityEntityType)
    : '';
  const actorParam = params.get('actor') ?? '';
  const actor =
    actorParam && (!actors.data || actors.data.some((a) => a.id === actorParam)) ? actorParam : '';
  const from = DAY.test(params.get('from') ?? '') ? params.get('from')! : '';
  const to = DAY.test(params.get('to') ?? '') ? params.get('to')! : '';
  const rangeError = from && to && to < from ? msg('MSG-PROJECT-34') : undefined;

  // While the range is invalid the list keeps the last valid dates (state derived during render).
  const [dates, setDates] = useState({ from, to });
  if (!rangeError && (dates.from !== from || dates.to !== to)) setDates({ from, to });

  const filters = useMemo<ActivityFilters>(
    () => ({
      entityType: type || undefined,
      actorId: actor || undefined,
      from: dates.from ? dayStart(dates.from) : undefined,
      to: dates.to ? dayStart(dates.to, 1) : undefined,
    }),
    [type, actor, dates.from, dates.to],
  );
  const filtered = Boolean(type || actor || from || to);

  const activity = useActivity(project.key, 20, true, filters);
  const listRef = useRef<HTMLDivElement>(null);
  const [loaded, setLoaded] = useState<string | null>(null);
  const pages = activity.data?.pages ?? [];
  const entries = pages.flatMap((page) => page.data);
  const lastPageSize = pages.at(-1)?.data.length ?? 0;

  // Read the address itself, not the last render's params, so quick changes in a row all stick.
  const setFilter = (name: string, value: string) => {
    const next = new URLSearchParams(window.location.search);
    if (value) next.set(name, value);
    else next.delete(name);
    setParams(next, { replace: true });
  };
  const clearFilters = () => setParams({}, { replace: true });

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

  return (
    <section aria-labelledby="activity-heading">
      <h2 id="activity-heading" className="mb-3 text-lg font-semibold">
        Activity
      </h2>
      <div className="mb-4 flex flex-wrap items-start gap-3">
        <SelectField
          label="Type"
          value={type}
          onChange={(e) => setFilter('type', e.target.value)}
          className="w-40"
        >
          <option value="">All</option>
          {ACTIVITY_ENTITY_TYPES.map((value) => (
            <option key={value} value={value}>
              {TYPE_LABELS[value]}
            </option>
          ))}
        </SelectField>
        <SelectField
          label="Person"
          value={actor}
          onChange={(e) => setFilter('actor', e.target.value)}
          className="w-48"
        >
          <option value="">Anyone</option>
          {actors.data?.map((person) => (
            <option key={person.id} value={person.id}>
              {person.name}
            </option>
          ))}
        </SelectField>
        <TextField
          label="From date"
          type="date"
          value={from}
          onChange={(e) => setFilter('from', e.target.value)}
          className="w-40"
        />
        <TextField
          label="To date"
          type="date"
          value={to}
          onChange={(e) => setFilter('to', e.target.value)}
          error={rangeError}
          className="w-40"
        />
        {filtered && (
          <Button variant="ghost" className="mt-6" onClick={clearFilters}>
            Clear filters
          </Button>
        )}
      </div>

      {activity.isError ? (
        <Alert>
          {msg('MSG-COMMON-01')}
          <Button size="sm" variant="outline" onClick={() => void activity.refetch()}>
            Try again
          </Button>
        </Alert>
      ) : (
        <Card>
          <div ref={listRef} aria-busy={activity.isPending || activity.isFetchingNextPage}>
            {activity.isPending && (
              <div className="flex flex-col gap-3" aria-hidden="true">
                {[0, 1, 2].map((n) => (
                  <div key={n} className="h-10 animate-pulse rounded-md bg-muted" />
                ))}
              </div>
            )}
            {activity.isSuccess && entries.length === 0 && (
              <div className="py-8 text-center">
                <p role="status" className="text-muted-foreground">
                  {filtered ? msg('MSG-PROJECT-35') : 'No activity yet'}
                </p>
              </div>
            )}
            {entries.length > 0 && <ActivityByDay entries={entries} />}
          </div>
        </Card>
      )}
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

import { useCallback, useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router';
import { msg } from '@qawm/shared';
import { EmptyState } from '@/components/EmptyState';
import { PageHeader } from '@/components/PageHeader';
import { Alert } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { inputClass } from '@/components/ui/field';
import { tableClass, tdClass, thClass } from '@/features/admin/format';
import { useProjects } from './api';
import { accessLabel, formatDateTime, relativeDays } from './labels';

/**
 * SCR-PROJECT-01: the projects I am in (all of them for a System admin), search, show archived.
 * Projects are created in the Admin console only (BR-ADMIN-18), so there is no "New project" here.
 */
export function ProjectListPage() {
  const [params, setParams] = useSearchParams();
  const q = params.get('q') ?? '';
  const archived = params.get('archived') === '1';
  const [search, setSearch] = useState(q);
  const projects = useProjects(q, archived);

  // Search after 300 ms without typing, or on Enter; the text is kept in the URL (?q=).
  const applySearch = useCallback(
    (text: string) =>
      setParams(
        () => {
          // Start from the address bar, not from the last render, so a quick checkbox click isn't lost.
          const next = new URLSearchParams(window.location.search);
          if (text.trim()) next.set('q', text.trim());
          else next.delete('q');
          return next;
        },
        { replace: true },
      ),
    [setParams],
  );
  useEffect(() => {
    if (search.trim() === q) return;
    const timer = setTimeout(() => applySearch(search), 300);
    return () => clearTimeout(timer);
  }, [search, q, applySearch]);

  function toggleArchived(on: boolean) {
    setParams(() => {
      const next = new URLSearchParams(window.location.search);
      if (on) next.set('archived', '1');
      else next.delete('archived');
      return next;
    });
  }

  const rows = projects.data ?? [];
  const empty = projects.isSuccess && rows.length === 0;

  return (
    <>
      <PageHeader title="Projects" />
      <Card>
        <div className="mb-4 flex flex-wrap items-center gap-x-6 gap-y-3">
          <label className="flex items-center gap-2 text-sm font-medium">
            Search
            <input
              type="search"
              value={search}
              maxLength={100}
              placeholder="Key or name"
              onChange={(event) => setSearch(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') applySearch(search);
              }}
              className={`${inputClass} w-64 max-w-full`}
            />
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={archived}
              onChange={(event) => toggleArchived(event.target.checked)}
              className="size-4"
            />
            Show archived
          </label>
        </div>

        {projects.isError && (
          <Alert>
            {msg('MSG-COMMON-01')}
            <Button size="sm" variant="outline" onClick={() => void projects.refetch()}>
              Try again
            </Button>
          </Alert>
        )}
        {empty &&
          (q ? (
            <EmptyState live title={msg('MSG-PROJECT-20')} />
          ) : (
            <EmptyState live title="No projects yet">
              {msg('MSG-ADMIN-10')}
            </EmptyState>
          ))}
        {(projects.isPending || rows.length > 0) && (
          <div className="overflow-x-auto">
            <table className={tableClass} aria-busy={projects.isPending}>
              <caption className="sr-only">Your projects</caption>
              <thead>
                <tr>
                  <th scope="col" className={thClass}>
                    Key
                  </th>
                  <th scope="col" className={thClass}>
                    Name
                  </th>
                  <th scope="col" className={thClass}>
                    My access
                  </th>
                  <th scope="col" className={`${thClass} hidden md:table-cell`}>
                    Members
                  </th>
                  <th scope="col" className={thClass}>
                    Active release
                  </th>
                  <th scope="col" className={`${thClass} hidden md:table-cell`}>
                    Updated
                  </th>
                </tr>
              </thead>
              <tbody>
                {projects.isPending &&
                  [0, 1, 2].map((i) => (
                    <tr key={i} aria-hidden="true">
                      <td colSpan={6} className={tdClass}>
                        <div className="h-4 animate-pulse rounded bg-muted" />
                      </td>
                    </tr>
                  ))}
                {rows.map((project) => (
                  <tr key={project.key}>
                    <td className={`${tdClass} font-mono text-xs text-muted-foreground`}>
                      {project.key}
                    </td>
                    <td className={tdClass}>
                      <Link
                        to={`/projects/${project.key}`}
                        className="font-semibold underline-offset-4 hover:underline"
                      >
                        {project.name}
                      </Link>
                      {project.archivedAt && (
                        <Badge tone="warning" className="ml-2">
                          Archived
                        </Badge>
                      )}
                    </td>
                    <td className={tdClass}>{accessLabel(project.myAccess)}</td>
                    <td className={`${tdClass} hidden font-mono md:table-cell`}>
                      {project.memberCount ?? '—'}
                    </td>
                    <td className={tdClass}>{project.activeRelease?.name ?? '—'}</td>
                    <td
                      className={`${tdClass} hidden text-muted-foreground md:table-cell`}
                      title={formatDateTime(project.updatedAt)}
                    >
                      {relativeDays(project.updatedAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </>
  );
}

import { useCallback, useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router';
import { msg } from '@qawm/shared';
import { PageHeader } from '@/components/PageHeader';
import { Alert } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { inputClass } from '@/components/ui/field';
import { useMe } from '@/features/auth/use-me';
import { useProjects } from './api';
import { accessLabel, relativeDays } from './labels';
import { NewProjectDialog } from './NewProjectDialog';

/**
 * SCR-PROJECT-01: the projects I am in (all of them for a System admin), search, show archived.
 * Only a System admin creates projects (BR-PROJECT-01).
 */
export function ProjectListPage() {
  const [params, setParams] = useSearchParams();
  const q = params.get('q') ?? '';
  const archived = params.get('archived') === '1';
  const [search, setSearch] = useState(q);
  const [creating, setCreating] = useState(false);
  const projects = useProjects(q, archived);
  const { data: me } = useMe();
  const isSystemAdmin = me?.globalRole === 'ADMIN';

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
      <PageHeader
        title="Projects"
        actions={isSystemAdmin && <Button onClick={() => setCreating(true)}>New project</Button>}
      />
      <div className="mb-4 flex flex-wrap items-center gap-6">
        <label className="flex items-center gap-2 text-sm font-medium">
          Search
          <input
            type="search"
            value={search}
            maxLength={100}
            onChange={(event) => setSearch(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') applySearch(search);
            }}
            className={`${inputClass} w-64`}
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

      {projects.isError ? (
        <Alert>
          {msg('MSG-COMMON-01')}
          <Button size="sm" variant="outline" onClick={() => void projects.refetch()}>
            Try again
          </Button>
        </Alert>
      ) : (
        <table className="w-full text-sm" aria-busy={projects.isPending}>
          <caption className="sr-only">Your projects</caption>
          <thead className="border-b text-left text-muted-foreground">
            <tr>
              <th scope="col" className="py-2 pr-4 font-medium">
                Key
              </th>
              <th scope="col" className="py-2 pr-4 font-medium">
                Name
              </th>
              <th scope="col" className="py-2 pr-4 font-medium">
                My access
              </th>
              <th scope="col" className="hidden py-2 pr-4 font-medium md:table-cell">
                Members
              </th>
              <th scope="col" className="py-2 pr-4 font-medium">
                Active release
              </th>
              <th scope="col" className="hidden py-2 font-medium md:table-cell">
                Updated
              </th>
            </tr>
          </thead>
          <tbody>
            {projects.isPending &&
              [0, 1, 2].map((i) => (
                <tr key={i} aria-hidden="true">
                  <td colSpan={6} className="py-3">
                    <div className="h-4 animate-pulse rounded bg-muted" />
                  </td>
                </tr>
              ))}
            {rows.map((project) => (
              <tr key={project.key} className="border-b last:border-0">
                <td className="py-2 pr-4 font-mono">{project.key}</td>
                <td className="py-2 pr-4">
                  <Link
                    to={`/projects/${project.key}`}
                    className="font-medium underline-offset-4 hover:underline"
                  >
                    {project.name}
                  </Link>
                  {project.archivedAt && <Badge className="ml-2">Archived</Badge>}
                </td>
                <td className="py-2 pr-4">{accessLabel(project.myAccess)}</td>
                <td className="hidden py-2 pr-4 md:table-cell">{project.memberCount}</td>
                <td className="py-2 pr-4">{project.activeRelease?.name ?? '—'}</td>
                <td className="hidden py-2 md:table-cell">{relativeDays(project.updatedAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      {empty && (
        <p role="status" className="mt-6 text-center text-muted-foreground">
          {q ? msg('MSG-PROJECT-20') : msg('MSG-PROJECT-21')}
        </p>
      )}

      {isSystemAdmin && <NewProjectDialog open={creating} onClose={() => setCreating(false)} />}
    </>
  );
}

import { useState } from 'react';
import { Link, NavLink, Outlet, useParams } from 'react-router';
import { msg, type Project } from '@qawm/shared';
import { PageHeader } from '@/components/PageHeader';
import { Alert } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Menu, type MenuItem } from '@/components/ui/menu';
import { useToast } from '@/components/ui/use-toast';
import { cn } from '@/lib/utils';
import { useProject, useProjectAction } from './api';
import type { ProjectOutletContext } from './project-outlet';
import { useProjectAccess } from './access';
import { roleLabel } from './labels';
import { timeLeft } from './milestone-time';
import { ArchiveProjectDialog, DeleteProjectDialog, EditProjectDialog } from './ProjectDialogs';
import { errorText, isNotFound } from './server-error';

const TABS = [
  { to: '', label: 'Overview', end: true },
  { to: 'members', label: 'Members' },
  { to: 'releases', label: 'Releases & milestones' },
  { to: 'activity', label: 'Activity' },
];

/** SCR-PROJECT-02: header, archived banner, current milestone and tabs, shared by every tab. */
export function ProjectLayout() {
  const { key = '' } = useParams();
  const project = useProject(key);

  if (project.isPending) {
    return (
      <div aria-busy="true" className="flex flex-col gap-3">
        <div className="h-8 w-64 animate-pulse rounded bg-muted" />
        <div className="h-4 w-96 animate-pulse rounded bg-muted" />
      </div>
    );
  }
  if (project.isError) {
    // Unknown key and "not a member" look the same (BR-PROJECT-06).
    if (isNotFound(project.error)) return <ProjectNotFound />;
    return (
      <Alert>
        {errorText(project.error)}
        <Button size="sm" variant="outline" onClick={() => void project.refetch()}>
          Try again
        </Button>
      </Alert>
    );
  }
  return <ProjectPage project={project.data} />;
}

function ProjectNotFound() {
  return (
    <>
      <PageHeader title={msg('MSG-PROJECT-06')} />
      <Button asChild variant="outline">
        <Link to="/projects">Back to projects</Link>
      </Button>
    </>
  );
}

function ProjectPage({ project }: { project: Project }) {
  const access = useProjectAccess(project);
  const toast = useToast();
  const restore = useProjectAction(project.key, 'restore');
  const [dialog, setDialog] = useState<'edit' | 'archive' | 'delete' | null>(null);
  const [restoreError, setRestoreError] = useState<string | null>(null);
  const canArchive = access.canEvenArchived('project:archive');

  async function doRestore() {
    setRestoreError(null);
    try {
      await restore.mutateAsync();
      toast(msg('MSG-PROJECT-19'));
    } catch (error) {
      setRestoreError(errorText(error));
    }
  }

  const moreItems: MenuItem[] = [];
  if (canArchive && !project.archivedAt) {
    moreItems.push({ label: 'Archive', onSelect: () => setDialog('archive') });
  }
  if (canArchive && project.archivedAt) {
    moreItems.push({ label: 'Restore', onSelect: () => void doRestore() });
  }
  if (access.canEvenArchived('project:delete') && project.archivedAt) {
    moreItems.push({ label: 'Delete', onSelect: () => setDialog('delete'), destructive: true });
  }

  return (
    <>
      <title>{`${project.name} · Projects · QA Work Management`}</title>
      <div className="mb-4 flex flex-wrap items-start justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-semibold tracking-tight">{project.name}</h1>
          <span className="font-mono text-sm text-muted-foreground">{project.key}</span>
          <Badge>{project.myRole ? roleLabel(project.myRole) : 'Admin'}</Badge>
          {project.archivedAt && <Badge tone="warning">Archived</Badge>}
        </div>
        <div className="flex items-center gap-2">
          {access.can('project:edit') && (
            <Button variant="outline" onClick={() => setDialog('edit')}>
              Edit
            </Button>
          )}
          {moreItems.length > 0 && <Menu label="More" items={moreItems} />}
        </div>
      </div>

      {project.archivedAt && (
        <div
          role="status"
          className="mb-4 flex flex-wrap items-center gap-3 rounded-md border border-destructive/40 bg-destructive/5 px-4 py-2 text-sm"
        >
          {msg('MSG-PROJECT-08')}
          {canArchive && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => void doRestore()}
              disabled={restore.isPending}
            >
              Restore
            </Button>
          )}
        </div>
      )}
      {restoreError && <Alert className="mb-4">{restoreError}</Alert>}

      {project.activeMilestone && (
        <p className="mb-4 text-sm">
          Current: <span className="font-medium">{project.activeMilestone.name}</span>
          {project.activeRelease && <> · release {project.activeRelease.name}</>} ·{' '}
          {timeLeft(project.activeMilestone.endDate)}
        </p>
      )}

      <nav aria-label="Project sections" className="mb-6 overflow-x-auto border-b">
        <ul className="flex gap-1">
          {TABS.map((tab) => (
            <li key={tab.label}>
              <NavLink
                to={tab.to}
                end={tab.end}
                className={({ isActive }) =>
                  cn(
                    '-mb-px inline-block border-b-2 border-transparent px-3 py-2 text-sm whitespace-nowrap hover:text-foreground',
                    isActive ? 'border-primary font-medium' : 'text-muted-foreground',
                  )
                }
              >
                {tab.label}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      <Outlet context={{ project } satisfies ProjectOutletContext} />

      <EditProjectDialog
        project={project}
        open={dialog === 'edit'}
        onClose={() => setDialog(null)}
      />
      <ArchiveProjectDialog
        project={project}
        open={dialog === 'archive'}
        onClose={() => setDialog(null)}
      />
      <DeleteProjectDialog
        project={project}
        open={dialog === 'delete'}
        onClose={() => setDialog(null)}
      />
    </>
  );
}

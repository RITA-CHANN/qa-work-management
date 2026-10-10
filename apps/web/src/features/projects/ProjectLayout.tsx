import { useState } from 'react';
import { Link, Outlet, useParams } from 'react-router';
import { msg, type Project } from '@qawm/shared';
import { PageHeader } from '@/components/PageHeader';
import { Alert } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Menu, type MenuItem } from '@/components/ui/menu';
import { useToast } from '@/components/ui/use-toast';
import { useProject, useProjectAction } from './api';
import type { ProjectOutletContext } from './project-outlet';
import { useProjectAccess } from './access';
import { accessLabel } from './labels';
import { timeLeft } from './milestone-time';
import { ArchiveProjectDialog, DeleteProjectDialog, EditProjectDialog } from './ProjectDialogs';
import { errorText, isNotFound } from './server-error';

/**
 * SCR-PROJECT-02: header, banners and current milestone, shared by every page of a project. The side nav
 * (SCR-SHELL-01) is the only way between the project's pages; there is no tab bar (Linh, 2026-10-10).
 */
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
      <title>{`${msg('MSG-PROJECT-06')} · QA Work Management`}</title>
      <PageHeader title={msg('MSG-PROJECT-06')} description={msg('MSG-PROJECT-53')} />
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
      toast(msg('MSG-PROJECT-51'));
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

  const canEdit = access.can('project:edit');
  const actionItems: MenuItem[] = [
    ...(canEdit ? [{ label: 'Edit', onSelect: () => setDialog('edit') }] : []),
    ...moreItems,
  ];

  return (
    <>
      <title>{`${project.name} · Projects · QA Work Management`}</title>
      <div className="mb-4 flex flex-wrap items-start justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-semibold tracking-tight">{project.name}</h1>
          <span className="font-mono text-sm text-muted-foreground">{project.key}</span>
          <Badge>{project.myAccess ? accessLabel(project.myAccess) : 'System admin'}</Badge>
          {project.archivedAt && <Badge tone="warning">Archived</Badge>}
        </div>
        <div className="hidden items-center gap-2 md:flex">
          {canEdit && (
            <Button variant="outline" onClick={() => setDialog('edit')}>
              Edit
            </Button>
          )}
          {moreItems.length > 0 && <Menu label="More" items={moreItems} />}
        </div>
        {/* Below 768 px Edit and More are one menu (SCR-PROJECT-02, Responsive). */}
        {actionItems.length > 0 && (
          <div className="md:hidden">
            <Menu label="Actions" items={actionItems} />
          </div>
        )}
      </div>

      {access.viewingAsAdmin && (
        <p
          role="status"
          className="mb-4 rounded-lg bg-admin px-4 py-2 text-sm font-medium text-admin-foreground"
        >
          {msg('MSG-ADMIN-08')}
        </p>
      )}

      {project.archivedAt && (
        <div
          role="status"
          className="mb-4 flex flex-wrap items-center gap-3 rounded-md border border-warning/30 bg-warning-tint px-4 py-2 text-sm text-warning-foreground"
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

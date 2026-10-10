import { useCallback, useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Link, useSearchParams } from 'react-router';
import { msg, type AdminProject } from '@qawm/shared';
import { EmptyState } from '@/components/EmptyState';
import { PageHeader } from '@/components/PageHeader';
import { Alert } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Dialog, DialogActions } from '@/components/ui/dialog';
import { SelectField, TextField } from '@/components/ui/field';
import { Menu } from '@/components/ui/menu';
import { useToast } from '@/components/ui/use-toast';
import { useUsers } from '@/features/projects/api';
import { NewProjectDialog } from '@/features/projects/NewProjectDialog';
import { ArchiveProjectDialog, DeleteProjectDialog } from '@/features/projects/ProjectDialogs';
import { errorText } from '@/features/projects/server-error';
import { adminKeys, useAdminProjectAction, useAdminProjects, useChangeProjectAdmin } from './api';
import { formatDate, formatDateTime, tableClass, tdClass, thClass } from './format';

type Status = 'all' | 'active' | 'archived';
const STATUSES: Status[] = ['all', 'active', 'archived'];

/**
 * SCR-ADMIN-02 Projects (BR-ADMIN-03): every project, archived included. Search (`?q=`) and status (`?status=`)
 * are kept in the URL, so Back from a project returns to the same list.
 */
export function AdminProjectsPage() {
  const [params, setParams] = useSearchParams();
  const q = params.get('q') ?? '';
  const statusParam = params.get('status') as Status | null;
  const status: Status = statusParam && STATUSES.includes(statusParam) ? statusParam : 'all';
  const [search, setSearch] = useState(q);
  const projects = useAdminProjects(q, status);
  const action = useAdminProjectAction();
  const toast = useToast();
  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);
  const [archiving, setArchiving] = useState<AdminProject | null>(null);
  const [deleting, setDeleting] = useState<AdminProject | null>(null);
  const [changingAdmin, setChangingAdmin] = useState<AdminProject | null>(null);
  const [creating, setCreating] = useState(false);
  const refresh = () => void queryClient.invalidateQueries({ queryKey: adminKeys.all });

  const setParam = useCallback(
    (name: string, value: string) =>
      setParams(
        () => {
          // Start from the address bar, not from the last render, so a quick status change isn't lost.
          const next = new URLSearchParams(window.location.search);
          if (value) next.set(name, value);
          else next.delete(name);
          return next;
        },
        { replace: true },
      ),
    [setParams],
  );
  // Search 300 ms after the last key, or on Enter.
  useEffect(() => {
    if (search.trim() === q) return;
    const timer = setTimeout(() => setParam('q', search.trim()), 300);
    return () => clearTimeout(timer);
  }, [search, q, setParam]);

  async function restore(key: string) {
    setError(null);
    try {
      await action.mutateAsync({ key, action: 'restore' });
      toast(msg('MSG-PROJECT-19'));
    } catch (e) {
      setError(errorText(e));
    }
  }

  const rows = projects.data ?? [];
  const noProjectsAtAll = projects.isSuccess && rows.length === 0 && !q && status === 'all';
  const noMatch = projects.isSuccess && rows.length === 0 && !noProjectsAtAll;

  return (
    <>
      <PageHeader
        title="Projects"
        actions={<Button onClick={() => setCreating(true)}>New project</Button>}
      />
      <Card>
        <div className="mb-4 flex flex-wrap items-end gap-3">
          <TextField
            label="Search projects"
            type="search"
            value={search}
            maxLength={100}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') setParam('q', search.trim());
            }}
            placeholder="Key or name"
            className="w-64"
          />
          <SelectField
            label="Status"
            value={status}
            onChange={(e) => setParam('status', e.target.value === 'all' ? '' : e.target.value)}
            className="w-40"
          >
            <option value="all">All</option>
            <option value="active">Active</option>
            <option value="archived">Archived</option>
          </SelectField>
        </div>
        {error && <Alert className="mb-4">{error}</Alert>}
        {projects.isPending && (
          <p role="status" className="py-6 text-sm text-muted-foreground">
            Loading projects…
          </p>
        )}
        {projects.isError && <Alert>{errorText(projects.error)}</Alert>}
        {noProjectsAtAll && (
          <EmptyState title={msg('MSG-ADMIN-20')}>
            <Button className="mt-2" onClick={() => setCreating(true)}>
              New project
            </Button>
          </EmptyState>
        )}
        {noMatch && <EmptyState title={msg('MSG-PROJECT-20')} />}
        {rows.length > 0 && (
          <div className="overflow-x-auto">
            <table className={tableClass}>
              <caption className="sr-only">All projects</caption>
              <thead>
                <tr>
                  <th scope="col" className={thClass}>
                    Project
                  </th>
                  <th scope="col" className={thClass}>
                    Status
                  </th>
                  <th scope="col" className={thClass}>
                    Project admins
                  </th>
                  <th scope="col" className={thClass}>
                    Members
                  </th>
                  <th scope="col" className={thClass}>
                    Release
                  </th>
                  <th scope="col" className={thClass}>
                    Sprint
                  </th>
                  <th scope="col" className={thClass}>
                    Last activity
                  </th>
                  <th scope="col" className={thClass}>
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {rows.map((p) => (
                  <tr key={p.key}>
                    <td className={tdClass}>
                      <span className="font-semibold">{p.name}</span>
                      <span className="ml-2 font-mono text-xs text-muted-foreground">{p.key}</span>
                    </td>
                    <td className={tdClass}>
                      <Badge tone={p.archived ? 'warning' : 'active'}>
                        {p.archived ? 'Archived' : 'Active'}
                      </Badge>
                    </td>
                    <td className={tdClass}>
                      {p.projectAdmins.map((a) => a.name).join(', ') || '—'}
                    </td>
                    <td className={`${tdClass} font-mono`}>{p.memberCount}</td>
                    <td className={tdClass}>
                      {p.activeRelease ? (
                        <>
                          <div>{p.activeRelease.name}</div>
                          <div className="text-xs text-muted-foreground">
                            {p.activeRelease.targetDate
                              ? `Target ${formatDate(p.activeRelease.targetDate)}`
                              : 'No target date'}
                          </div>
                        </>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td className={tdClass}>
                      {p.activeMilestone ? (
                        <>
                          <div>{p.activeMilestone.name}</div>
                          <div className="text-xs text-muted-foreground">
                            Ends {formatDate(p.activeMilestone.endDate)}
                          </div>
                        </>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td className={`${tdClass} text-muted-foreground`}>
                      {p.lastActivityAt ? formatDateTime(p.lastActivityAt) : '—'}
                    </td>
                    <td className={`${tdClass} text-right`}>
                      <div className="flex justify-end gap-2">
                        <Button asChild size="sm" variant="outline">
                          <Link to={`/projects/${p.key}`} aria-label={`Open ${p.name}`}>
                            Open
                          </Link>
                        </Button>
                        <Menu
                          label={`Actions for ${p.name}`}
                          trigger={<span className="text-sm">More</span>}
                          items={
                            p.archived
                              ? [
                                  { label: 'Restore', onSelect: () => void restore(p.key) },
                                  {
                                    label: 'Delete',
                                    onSelect: () => setDeleting(p),
                                    destructive: true,
                                  },
                                ]
                              : [
                                  {
                                    label: 'Change project admin',
                                    onSelect: () => setChangingAdmin(p),
                                  },
                                  { label: 'Archive', onSelect: () => setArchiving(p) },
                                ]
                          }
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
      {/* The same Archive and Delete dialogs as the User UI (FLW-PROJECT-03); the Admin stays on this page. */}
      {archiving && (
        <ArchiveProjectDialog
          project={archiving}
          open
          onClose={() => setArchiving(null)}
          onDone={refresh}
        />
      )}
      {deleting && (
        <DeleteProjectDialog
          project={deleting}
          open
          onClose={() => setDeleting(null)}
          onDone={refresh}
          note={msg('MSG-PROJECT-09')}
        />
      )}
      {changingAdmin && (
        <ChangeAdminDialog project={changingAdmin} onClose={() => setChangingAdmin(null)} />
      )}
      {/* BR-ADMIN-18: the new project shows up in this list; the Admin stays in the console. */}
      <NewProjectDialog open={creating} onClose={() => setCreating(false)} onCreated={refresh} />
    </>
  );
}

/** BR-ADMIN-04: make someone Project admin, optionally turning the current ones into Members. */
function ChangeAdminDialog({ project, onClose }: { project: AdminProject; onClose: () => void }) {
  const users = useUsers(true);
  const change = useChangeProjectAdmin(project.key);
  const toast = useToast();
  const [userId, setUserId] = useState('');
  const [demoteCurrent, setDemoteCurrent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const current = project.projectAdmins.map((a) => a.name).join(', ') || '—';
  const adminIds = new Set(project.projectAdmins.map((a) => a.id));
  const chosen = project.projectAdmins.find((a) => a.id === userId);
  // Nothing would change: the chosen user already is Project admin and nobody else would become a Member.
  const noChange = !!chosen && (!demoteCurrent || adminIds.size === 1);

  async function save() {
    setError(null);
    try {
      await change.mutateAsync({ userId, demoteCurrent });
      toast(msg('MSG-PROJECT-19'));
      onClose();
    } catch (e) {
      setError(errorText(e));
    }
  }

  return (
    <Dialog open onClose={onClose} title={`Change project admin of ${project.name}`}>
      <div className="flex flex-col gap-4">
        {error && <Alert>{error}</Alert>}
        <p className="text-sm">
          <span className="text-muted-foreground">Current project admins:</span> {current}
        </p>
        <SelectField
          label="New project admin"
          value={userId}
          onChange={(e) => setUserId(e.target.value)}
          hint={chosen && noChange ? msg('MSG-ADMIN-21', { name: chosen.name }) : undefined}
        >
          <option value="" disabled>
            {users.isPending ? 'Loading…' : 'Choose a user'}
          </option>
          {(users.data ?? []).map((user) => (
            <option key={user.id} value={user.id}>
              {user.name} ({user.email}){adminIds.has(user.id) ? ' · project admin' : ''}
            </option>
          ))}
        </SelectField>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={demoteCurrent}
            onChange={(e) => setDemoteCurrent(e.target.checked)}
          />
          Make the current project admins members
        </label>
      </div>
      <DialogActions>
        <Button variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button disabled={!userId || noChange || change.isPending} onClick={() => void save()}>
          Save
        </Button>
      </DialogActions>
    </Dialog>
  );
}

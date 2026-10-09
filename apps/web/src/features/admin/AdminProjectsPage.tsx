import { useState } from 'react';
import { Link } from 'react-router';
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
import { errorText } from '@/features/projects/server-error';
import { useAdminProjectAction, useAdminProjects } from './api';
import { formatDateTime, tableClass, tdClass, thClass } from './format';

type Status = 'all' | 'active' | 'archived';

/** SCR-ADMIN-02 Projects (BR-ADMIN-03): every project, archived included. */
export function AdminProjectsPage() {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<Status>('all');
  const projects = useAdminProjects(search, status);
  const action = useAdminProjectAction();
  const toast = useToast();
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<AdminProject | null>(null);

  async function run(key: string, kind: 'archive' | 'restore') {
    setError(null);
    try {
      await action.mutateAsync({ key, action: kind });
      toast(msg('MSG-PROJECT-19'));
    } catch (e) {
      setError(errorText(e));
    }
  }

  return (
    <>
      <PageHeader title="Projects" description="Open, archive, restore or delete any project" />
      <Card>
        <div className="mb-4 flex flex-wrap items-end gap-3">
          <TextField
            label="Search projects"
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Key or name"
            className="w-64"
          />
          <SelectField
            label="Status"
            value={status}
            onChange={(e) => setStatus(e.target.value as Status)}
            className="w-40"
          >
            <option value="all">All</option>
            <option value="active">Active</option>
            <option value="archived">Archived</option>
          </SelectField>
        </div>
        {error && <Alert className="mb-4">{error}</Alert>}
        {projects.isError && <Alert>{errorText(projects.error)}</Alert>}
        {projects.data?.length === 0 && <EmptyState title={msg('MSG-PROJECT-20')} />}
        {!!projects.data?.length && (
          <div className="overflow-x-auto">
            <table className={tableClass}>
              <caption className="sr-only">All projects</caption>
              <thead>
                <tr>
                  <th className={thClass}>Project</th>
                  <th className={thClass}>Status</th>
                  <th className={thClass}>Project admins</th>
                  <th className={thClass}>Members</th>
                  <th className={thClass}>Last activity</th>
                  <th className={thClass}>
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {projects.data.map((p) => (
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
                                  { label: 'Restore', onSelect: () => void run(p.key, 'restore') },
                                  {
                                    label: 'Delete',
                                    onSelect: () => setDeleting(p),
                                    destructive: true,
                                  },
                                ]
                              : [{ label: 'Archive', onSelect: () => void run(p.key, 'archive') }]
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
      {deleting && <DeleteDialog project={deleting} onClose={() => setDeleting(null)} />}
    </>
  );
}

/** BR-PROJECT-09: the key must be typed (MSG-PROJECT-10). The API still refuses a project that has releases. */
function DeleteDialog({ project, onClose }: { project: AdminProject; onClose: () => void }) {
  const [typed, setTyped] = useState('');
  const [error, setError] = useState<string | null>(null);
  const action = useAdminProjectAction();
  const toast = useToast();
  return (
    <Dialog open onClose={onClose} title={`Delete ${project.name}?`} role="alertdialog">
      {error && <Alert>{error}</Alert>}
      <TextField
        label={msg('MSG-PROJECT-10', { key: project.key })}
        value={typed}
        onChange={(e) => setTyped(e.target.value)}
        autoComplete="off"
      />
      <DialogActions>
        <Button variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button
          variant="destructive"
          disabled={typed !== project.key || action.isPending}
          onClick={async () => {
            try {
              await action.mutateAsync({ key: project.key, action: 'delete' });
              toast(msg('MSG-PROJECT-19'));
              onClose();
            } catch (e) {
              setError(errorText(e));
            }
          }}
        >
          Delete project
        </Button>
      </DialogActions>
    </Dialog>
  );
}

import { useState } from 'react';
import { msg, type GuestArea } from '@qawm/shared';
import { Alert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { GuestAreaSwitches } from '@/features/guest/GuestAreaSwitches';
import { useProjectAccess } from './access';
import { useGuestVisibility } from './api';
import { NotFoundPage } from '@/pages/NotFoundPage';
import { EditProjectDialog } from './ProjectDialogs';
import { useProjectOutlet } from './project-outlet';
import { errorText } from './server-error';

/** Settings tab of SCR-PROJECT-02 (Q-ADMIN-04): project details and what Guests can see (BR-GUEST-02). */
export function SettingsTab() {
  const { project } = useProjectOutlet();
  const access = useProjectAccess(project);
  const save = useGuestVisibility(project.key);
  const toast = useToast();
  const [editing, setEditing] = useState(false);
  const [areas, setAreas] = useState<GuestArea[]>(project.guestAreas as GuestArea[]);
  const [error, setError] = useState<string | null>(null);
  const canChange = access.can('project:guests');
  const changed = [...areas].sort().join() !== [...project.guestAreas].sort().join();

  async function saveAreas() {
    setError(null);
    try {
      await save.mutateAsync({ areas });
      toast(msg('MSG-GUEST-02'));
    } catch (failure) {
      setError(errorText(failure));
    }
  }

  return (
    <div className="grid items-start gap-5 lg:grid-cols-2">
      <Card
        title="Project details"
        actions={
          access.can('project:edit') && (
            <Button size="sm" variant="outline" onClick={() => setEditing(true)}>
              Edit details
            </Button>
          )
        }
      >
        <dl className="grid grid-cols-[8rem_1fr] gap-x-4 gap-y-2 text-sm">
          <dt className="text-muted-foreground">Key</dt>
          <dd className="font-mono">{project.key}</dd>
          <dt className="text-muted-foreground">Name</dt>
          <dd>{project.name}</dd>
          <dt className="text-muted-foreground">Description</dt>
          <dd className="whitespace-pre-line">{project.description ?? '—'}</dd>
          <dt className="text-muted-foreground">Created</dt>
          <dd>
            {project.createdBy.name}, {project.createdAt.slice(0, 10)}
          </dd>
        </dl>
      </Card>

      <Card title="Guests">
        {error && <Alert className="mb-2">{error}</Alert>}
        <GuestAreaSwitches value={areas} onChange={setAreas} disabled={!canChange} />
        {canChange && (
          <div className="mt-4 flex justify-end gap-2">
            <Button
              variant="outline"
              disabled={!changed || save.isPending}
              onClick={() => setAreas(project.guestAreas as GuestArea[])}
            >
              Cancel
            </Button>
            <Button disabled={!changed || save.isPending} onClick={() => void saveAreas()}>
              Save
            </Button>
          </div>
        )}
      </Card>

      <EditProjectDialog project={project} open={editing} onClose={() => setEditing(false)} />
    </div>
  );
}

/** Settings exists only for those who may change it: Project admins and System admins. */
export function SettingsRoute() {
  const { project } = useProjectOutlet();
  return useProjectAccess(project).canEvenArchived('project:guests') ? (
    <SettingsTab />
  ) : (
    <NotFoundPage />
  );
}

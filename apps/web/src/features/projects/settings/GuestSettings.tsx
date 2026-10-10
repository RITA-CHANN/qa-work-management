import { useState } from 'react';
import { msg, type GuestArea } from '@qawm/shared';
import { Alert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { GuestAreaSwitches } from '@/features/guest/GuestAreaSwitches';
import { useProjectAccess } from '../access';
import { useGuestVisibility } from '../api';
import { useProjectOutlet } from '../project-outlet';
import { errorText } from '../server-error';
import { SettingsSection } from './SettingsSection';

/** Settings › Guests (SCR-PROJECT-06): what Guests of this project can see (BR-GUEST-02). */
export function GuestSettings() {
  const { project } = useProjectOutlet();
  const access = useProjectAccess(project);
  const save = useGuestVisibility(project.key);
  const toast = useToast();
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
    <SettingsSection title="Guests">
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
    </SettingsSection>
  );
}

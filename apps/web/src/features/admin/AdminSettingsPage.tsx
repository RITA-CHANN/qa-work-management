import { useState, type FormEvent } from 'react';
import { msg, workspaceSettingsSchema, type GuestArea, type WorkspaceSettings } from '@qawm/shared';
import { PageHeader } from '@/components/PageHeader';
import { Alert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { TextField } from '@/components/ui/field';
import { useToast } from '@/components/ui/use-toast';
import { GuestAreaSwitches } from '@/features/guest/GuestAreaSwitches';
import { errorText } from '@/features/projects/server-error';
import { useSaveSettings, useWorkspaceSettings } from './api';

/** SCR-ADMIN-05 Settings: Guest defaults for new projects (BR-GUEST-02) and audit retention (BR-ADMIN-17). */
export function AdminSettingsPage() {
  const settings = useWorkspaceSettings();
  return (
    <>
      <PageHeader title="Settings" />
      {settings.isError && <Alert>{errorText(settings.error)}</Alert>}
      {settings.isPending && <p role="status">Loading…</p>}
      {/* Mounted once loaded, so the form starts from the saved values. */}
      {settings.data && <SettingsForm saved={settings.data} />}
    </>
  );
}

function SettingsForm({ saved }: { saved: WorkspaceSettings }) {
  const save = useSaveSettings();
  const toast = useToast();
  const [areas, setAreas] = useState<GuestArea[]>(saved.defaultGuestAreas);
  const [days, setDays] = useState(String(saved.auditRetentionDays));
  const [daysError, setDaysError] = useState<string | undefined>();
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    const parsed = workspaceSettingsSchema.safeParse({
      defaultGuestAreas: areas,
      auditRetentionDays: Number(days),
    });
    if (!parsed.success) {
      setDaysError(msg('MSG-ADMIN-18'));
      return;
    }
    setDaysError(undefined);
    try {
      await save.mutateAsync(parsed.data);
      toast(msg('MSG-ADMIN-19'));
    } catch (e) {
      setError(errorText(e));
    }
  }

  return (
    <form noValidate onSubmit={handleSubmit} className="grid max-w-3xl gap-5">
      {error && <Alert>{error}</Alert>}
      <Card title="Guest access for new projects">
        <GuestAreaSwitches value={areas} onChange={setAreas} />
      </Card>
      <Card title="Audit log">
        <TextField
          label="Keep audit events (days)"
          type="number"
          inputMode="numeric"
          min={30}
          max={3650}
          value={days}
          onChange={(e) => setDays(e.target.value)}
          error={daysError}
          className="w-48"
        />
      </Card>
      <div className="flex justify-end">
        <Button type="submit" disabled={save.isPending}>
          Save settings
        </Button>
      </div>
    </form>
  );
}

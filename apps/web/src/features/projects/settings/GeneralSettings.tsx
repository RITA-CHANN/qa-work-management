import { useRef, useState, type FormEvent } from 'react';
import { useBlocker } from 'react-router';
import { msg, projectUpdateSchema } from '@qawm/shared';
import { Alert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Dialog, DialogActions } from '@/components/ui/dialog';
import { TextAreaField, TextField } from '@/components/ui/field';
import { useToast } from '@/components/ui/use-toast';
import { ApiRequestError } from '@/lib/api-client';
import { useProjectAccess } from '../access';
import { useProject, useUpdateProject } from '../api';
import {
  focusFirstInvalid,
  serverFieldErrors,
  zodFieldErrors,
  type FieldErrors,
} from '../form-errors';
import { useProjectOutlet } from '../project-outlet';
import { errorText, isConflict } from '../server-error';
import { SettingsSection } from './SettingsSection';

type Values = { name: string; description: string; version: number };

/**
 * Settings › General (SCR-PROJECT-06): name and description edited in place. The form keeps the version
 * it started from, so a save after someone else's change gets 409 and offers Reload (BR-PROJECT-07).
 */
export function GeneralSettings() {
  const { project } = useProjectOutlet();
  const access = useProjectAccess(project);
  const update = useUpdateProject(project.key);
  const fresh = useProject(project.key);
  const toast = useToast();
  const formRef = useRef<HTMLFormElement>(null);
  const saved: Values = {
    name: project.name,
    description: project.description ?? '',
    version: project.version,
  };
  const [base, setBase] = useState<Values>(saved);
  const [form, setForm] = useState({ name: saved.name, description: saved.description });
  const [errors, setErrors] = useState<FieldErrors>({});
  const [alert, setAlert] = useState<{ text: string; conflict: boolean } | null>(null);
  const editable = access.can('project:edit');
  const dirty = form.name !== base.name || form.description !== base.description;

  // While the form is clean, follow the project as it changes (someone else's save, a refetch).
  if (!dirty && project.version !== base.version) {
    setBase(saved);
    setForm({ name: saved.name, description: saved.description });
  }

  // AC-PROJECT-123: ask before leaving with unsaved changes.
  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) =>
      dirty && editable && currentLocation.pathname !== nextLocation.pathname,
  );

  function reset(values: Values) {
    setBase(values);
    setForm({ name: values.name, description: values.description });
    setErrors({});
    setAlert(null);
  }

  async function reload() {
    const { data } = await fresh.refetch();
    if (data)
      reset({ name: data.name, description: data.description ?? '', version: data.version });
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const parsed = projectUpdateSchema.safeParse({
      version: base.version,
      name: form.name,
      description: form.description || null,
    });
    setAlert(null);
    if (!parsed.success) {
      setErrors(zodFieldErrors(parsed.error));
      focusFirstInvalid(formRef.current);
      return;
    }
    setErrors({});
    try {
      const result = await update.mutateAsync(parsed.data);
      reset({
        name: result.name,
        description: result.description ?? '',
        version: result.version,
      });
      toast(msg('MSG-PROJECT-19'));
    } catch (error) {
      if (error instanceof ApiRequestError && error.code === 'VALIDATION_ERROR') {
        setErrors(serverFieldErrors(error));
        focusFirstInvalid(formRef.current);
      } else {
        setAlert({ text: errorText(error), conflict: isConflict(error) });
      }
    }
  }

  return (
    <SettingsSection title="General">
      <form ref={formRef} noValidate onSubmit={handleSubmit} className="flex flex-col gap-4">
        {alert && (
          <Alert>
            {alert.text}
            {alert.conflict && (
              <Button type="button" size="sm" variant="outline" onClick={() => void reload()}>
                Reload
              </Button>
            )}
          </Alert>
        )}
        <div className="flex flex-col gap-1.5">
          <span className="text-sm font-medium">Key</span>
          <span className="font-mono text-sm">{project.key}</span>
        </div>
        <TextField
          label="Name"
          value={form.name}
          readOnly={!editable}
          onChange={(event) => setForm({ ...form, name: event.target.value })}
          error={errors.name}
        />
        <TextAreaField
          label="Description"
          value={form.description}
          readOnly={!editable}
          onChange={(event) => setForm({ ...form, description: event.target.value })}
          error={errors.description}
          hint={editable ? `${form.description.length} / 2000` : undefined}
        />
        <dl className="grid grid-cols-[8rem_1fr] gap-x-4 gap-y-2 text-sm">
          <dt className="text-muted-foreground">Created</dt>
          <dd>
            {project.createdBy.name}, {project.createdAt.slice(0, 10)}
          </dd>
          <dt className="text-muted-foreground">Last changed</dt>
          <dd>{project.updatedAt.slice(0, 16).replace('T', ' ')}</dd>
        </dl>
        {editable && (
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              disabled={!dirty || update.isPending}
              onClick={() => reset(base)}
            >
              Discard
            </Button>
            <Button type="submit" disabled={!dirty || update.isPending}>
              {update.isPending ? 'Saving…' : 'Save'}
            </Button>
          </div>
        )}
      </form>

      <Dialog
        open={blocker.state === 'blocked'}
        onClose={() => blocker.reset?.()}
        role="alertdialog"
        title="Unsaved changes"
        description={msg('MSG-COMMON-15')}
      >
        <DialogActions>
          <Button variant="outline" onClick={() => blocker.reset?.()}>
            Stay
          </Button>
          <Button variant="destructive" onClick={() => blocker.proceed?.()}>
            Leave
          </Button>
        </DialogActions>
      </Dialog>
    </SettingsSection>
  );
}

import { useRef, useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router';
import { msg, projectUpdateSchema, type Project } from '@qawm/shared';
import { Alert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Dialog, DialogActions } from '@/components/ui/dialog';
import { TextAreaField, TextField } from '@/components/ui/field';
import { useToast } from '@/components/ui/use-toast';
import { ApiRequestError } from '@/lib/api-client';
import { useDeleteProject, useProject, useProjectAction, useUpdateProject } from './api';
import {
  focusFirstInvalid,
  serverFieldErrors,
  zodFieldErrors,
  type FieldErrors,
} from './form-errors';
import { errorText, isConflict } from './server-error';

type DialogProps = { project: Project; open: boolean; onClose: () => void };

/**
 * "Edit project" (SCR-PROJECT-02). Sends the version it was opened with; if someone saved in between,
 * the server answers 409 and the dialog keeps the input and offers "Reload" (BR-PROJECT-07, AC-PROJECT-21).
 */
export function EditProjectDialog({ project, open, onClose }: DialogProps) {
  return (
    <Dialog open={open} onClose={onClose} title="Edit project">
      {/* Mounted only while open, so the form starts from the project as it is when opened. */}
      <EditProjectForm project={project} onClose={onClose} />
    </Dialog>
  );
}

function EditProjectForm({ project, onClose }: { project: Project; onClose: () => void }) {
  const update = useUpdateProject(project.key);
  const fresh = useProject(project.key);
  const toast = useToast();
  const formRef = useRef<HTMLFormElement>(null);
  const [form, setForm] = useState({
    name: project.name,
    description: project.description ?? '',
    version: project.version,
  });
  const [errors, setErrors] = useState<FieldErrors>({});
  const [alert, setAlert] = useState<{ text: string; conflict: boolean } | null>(null);

  async function reload() {
    const { data } = await fresh.refetch();
    if (data) {
      setForm({ name: data.name, description: data.description ?? '', version: data.version });
      setAlert(null);
    }
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const parsed = projectUpdateSchema.safeParse({
      version: form.version,
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
      await update.mutateAsync(parsed.data);
      onClose();
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
        onChange={(event) => setForm({ ...form, name: event.target.value })}
        error={errors.name}
      />
      <TextAreaField
        label="Description"
        value={form.description}
        onChange={(event) => setForm({ ...form, description: event.target.value })}
        error={errors.description}
        hint={`${form.description.length} / 2000`}
      />
      <DialogActions>
        <Button type="button" variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button type="submit" disabled={update.isPending}>
          Save
        </Button>
      </DialogActions>
    </form>
  );
}

/** "Archive project?" (FLW-PROJECT-03): read-only for everyone until restored. */
export function ArchiveProjectDialog({ project, open, onClose }: DialogProps) {
  const archive = useProjectAction(project.key, 'archive');
  const toast = useToast();
  const [alert, setAlert] = useState<string | null>(null);

  async function confirm() {
    setAlert(null);
    try {
      await archive.mutateAsync();
      onClose();
      toast(msg('MSG-PROJECT-19'));
    } catch (error) {
      setAlert(errorText(error));
    }
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      role="alertdialog"
      title="Archive project?"
      description={`${project.name} becomes read-only for everyone and leaves the project list. An Owner can restore it at any time.`}
    >
      {alert && <Alert>{alert}</Alert>}
      <DialogActions>
        <Button variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button onClick={() => void confirm()} disabled={archive.isPending}>
          Archive
        </Button>
      </DialogActions>
    </Dialog>
  );
}

/** "Delete project?" (FLW-PROJECT-03): the Owner types the key to confirm (BR-PROJECT-09). */
export function DeleteProjectDialog({ project, open, onClose }: DialogProps) {
  const remove = useDeleteProject(project.key);
  const navigate = useNavigate();
  const toast = useToast();
  const [typed, setTyped] = useState('');
  const [alert, setAlert] = useState<string | null>(null);
  const matches = typed === project.key;

  function close() {
    setTyped('');
    setAlert(null);
    onClose();
  }

  async function confirm() {
    setAlert(null);
    try {
      await remove.mutateAsync();
      close();
      toast(`Project ${project.key} deleted`);
      void navigate('/projects');
    } catch (error) {
      setAlert(errorText(error));
    }
  }

  return (
    <Dialog
      open={open}
      onClose={close}
      role="alertdialog"
      title="Delete project?"
      description={`${project.name} and its members and activity are deleted for good. This can't be undone.`}
    >
      {alert && <Alert>{alert}</Alert>}
      <TextField
        label={`Type ${project.key} to confirm`}
        value={typed}
        autoComplete="off"
        onChange={(event) => setTyped(event.target.value)}
        error={typed && !matches ? msg('MSG-PROJECT-10', { key: project.key }) : undefined}
      />
      <DialogActions>
        <Button variant="outline" onClick={close}>
          Cancel
        </Button>
        <Button
          variant="destructive"
          onClick={() => void confirm()}
          disabled={!matches || remove.isPending}
        >
          Delete
        </Button>
      </DialogActions>
    </Dialog>
  );
}

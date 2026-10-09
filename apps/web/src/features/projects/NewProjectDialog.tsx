import { useRef, useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router';
import { msg, projectCreateSchema } from '@qawm/shared';
import { Alert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Dialog, DialogActions } from '@/components/ui/dialog';
import { TextAreaField, TextField } from '@/components/ui/field';
import { useToast } from '@/components/ui/use-toast';
import { ApiRequestError } from '@/lib/api-client';
import { useCreateProject } from './api';
import {
  focusFirstInvalid,
  serverFieldErrors,
  zodFieldErrors,
  type FieldErrors,
} from './form-errors';
import { errorText } from './server-error';

/** "New project" dialog of SCR-PROJECT-01 (FLW-PROJECT-01). */
export function NewProjectDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const create = useCreateProject();
  const navigate = useNavigate();
  const toast = useToast();
  const formRef = useRef<HTMLFormElement>(null);
  const [key, setKey] = useState('');
  const [description, setDescription] = useState('');
  const [errors, setErrors] = useState<FieldErrors>({});
  const [alert, setAlert] = useState<string | null>(null);

  function close() {
    setKey('');
    setDescription('');
    setErrors({});
    setAlert(null);
    create.reset();
    onClose();
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const parsed = projectCreateSchema.safeParse({
      key: form.get('key'),
      name: form.get('name'),
      description: String(form.get('description') ?? '') || null,
    });
    setAlert(null);
    if (!parsed.success) {
      setErrors(zodFieldErrors(parsed.error));
      focusFirstInvalid(formRef.current);
      return;
    }
    setErrors({});
    try {
      const project = await create.mutateAsync(parsed.data);
      close();
      toast(msg('MSG-PROJECT-19'));
      void navigate(`/projects/${project.key}`);
    } catch (error) {
      if (error instanceof ApiRequestError && error.code === 'KEY_TAKEN') {
        setErrors({ key: error.message });
      } else if (error instanceof ApiRequestError && error.code === 'VALIDATION_ERROR') {
        setErrors(serverFieldErrors(error));
      } else {
        setAlert(errorText(error));
      }
      focusFirstInvalid(formRef.current);
    }
  }

  return (
    <Dialog open={open} onClose={close} title="New project">
      <form ref={formRef} noValidate onSubmit={handleSubmit} className="flex flex-col gap-4">
        {alert && <Alert>{alert}</Alert>}
        <TextField
          label="Key"
          name="key"
          autoFocus
          autoComplete="off"
          autoCapitalize="characters"
          value={key}
          onChange={(event) => setKey(event.target.value.toUpperCase())}
          error={errors.key}
          hint="2–10 letters or digits, starting with a letter. It can't be changed later."
        />
        <TextField label="Name" name="name" autoComplete="off" error={errors.name} />
        <TextAreaField
          label="Description"
          name="description"
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          error={errors.description}
          hint={`${description.length} / 2000`}
        />
        <DialogActions>
          <Button type="button" variant="outline" onClick={close}>
            Cancel
          </Button>
          <Button type="submit" disabled={create.isPending}>
            Create
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}

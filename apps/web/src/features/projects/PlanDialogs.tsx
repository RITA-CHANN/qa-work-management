import { useRef, useState, type FormEvent } from 'react';
import {
  inclusiveDays,
  isoDateSchema,
  milestoneCreateSchema,
  milestoneUpdateSchema,
  msg,
  releaseCreateSchema,
  releaseUpdateSchema,
  type Milestone,
  type Release,
} from '@qawm/shared';
import { Alert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Dialog, DialogActions } from '@/components/ui/dialog';
import { SelectField, TextAreaField, TextField } from '@/components/ui/field';
import { useToast } from '@/components/ui/use-toast';
import { ApiRequestError } from '@/lib/api-client';
import { useSaveMilestone, useSaveRelease } from './api';
import {
  focusFirstInvalid,
  serverFieldErrors,
  zodFieldErrors,
  type FieldErrors,
} from './form-errors';
import { RELEASE_STATUS_LABELS } from './labels';
import { errorText, isConflict } from './server-error';

/** Server errors that belong under the date fields rather than at the top (SCR-PROJECT-04). */
const DATE_CODES = new Set(['MILESTONE_OUTSIDE_RELEASE', 'MILESTONE_OVERLAP']);

type ServerAlert = { text: string; conflict: boolean } | null;

function useServerErrors() {
  const [errors, setErrors] = useState<FieldErrors>({});
  const [alert, setAlert] = useState<ServerAlert>(null);
  function fromError(error: unknown, field?: string) {
    if (error instanceof ApiRequestError && error.code === 'VALIDATION_ERROR') {
      setErrors(serverFieldErrors(error));
    } else if (error instanceof ApiRequestError && field) {
      setErrors({ [field]: error.message });
    } else {
      setAlert({ text: errorText(error), conflict: isConflict(error) });
    }
  }
  return { errors, setErrors, alert, setAlert, fromError };
}

/** "New release" / "Edit release" (SCR-PROJECT-04). */
export function ReleaseDialog({
  projectKey,
  open,
  release,
  onClose,
}: {
  projectKey: string;
  open: boolean;
  release?: Release;
  onClose: () => void;
}) {
  return (
    <Dialog open={open} onClose={onClose} title={release ? 'Edit release' : 'New release'}>
      <ReleaseForm projectKey={projectKey} release={release} onClose={onClose} />
    </Dialog>
  );
}

function ReleaseForm({
  projectKey,
  release,
  onClose,
}: {
  projectKey: string;
  release?: Release;
  onClose: () => void;
}) {
  const save = useSaveRelease(projectKey);
  const toast = useToast();
  const formRef = useRef<HTMLFormElement>(null);
  const { errors, setErrors, alert, setAlert, fromError } = useServerErrors();

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const fields = {
      name: form.get('name'),
      startDate: String(form.get('startDate') ?? '') || null,
      targetDate: String(form.get('targetDate') ?? '') || null,
    };
    const parsed = release
      ? releaseUpdateSchema.safeParse({ ...fields, version: release.version })
      : releaseCreateSchema.safeParse(fields);
    setAlert(null);
    if (!parsed.success) {
      setErrors(zodFieldErrors(parsed.error));
      focusFirstInvalid(formRef.current);
      return;
    }
    setErrors({});
    try {
      await save.mutateAsync({ id: release?.id, body: parsed.data });
      onClose();
      toast(msg('MSG-PROJECT-19'));
    } catch (error) {
      const code = error instanceof ApiRequestError ? error.code : undefined;
      fromError(error, code === 'RELEASE_NAME_TAKEN' ? 'name' : undefined);
      focusFirstInvalid(formRef.current);
    }
  }

  return (
    <form ref={formRef} noValidate onSubmit={handleSubmit} className="flex flex-col gap-4">
      {alert && <Alert>{alert.text}</Alert>}
      <TextField label="Name" name="name" defaultValue={release?.name} error={errors.name} />
      <div className="grid grid-cols-2 gap-4">
        <TextField
          label="Start date"
          name="startDate"
          type="date"
          defaultValue={release?.startDate ?? ''}
          error={errors.startDate}
        />
        <TextField
          label="Target date"
          name="targetDate"
          type="date"
          defaultValue={release?.targetDate ?? ''}
          error={errors.targetDate}
        />
      </div>
      <DialogActions>
        <Button type="button" variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button type="submit" disabled={save.isPending}>
          Save
        </Button>
      </DialogActions>
    </form>
  );
}

/** "New milestone" / "Edit milestone" (SCR-PROJECT-04): release, name, goal, dates with a live length. */
export function MilestoneDialog({
  projectKey,
  open,
  milestone,
  releases,
  onClose,
}: {
  projectKey: string;
  open: boolean;
  milestone?: Milestone;
  releases: Release[];
  onClose: () => void;
}) {
  return (
    <Dialog open={open} onClose={onClose} title={milestone ? 'Edit milestone' : 'New milestone'}>
      <MilestoneForm
        projectKey={projectKey}
        milestone={milestone}
        releases={releases}
        onClose={onClose}
      />
    </Dialog>
  );
}

function MilestoneForm({
  projectKey,
  milestone,
  releases,
  onClose,
}: {
  projectKey: string;
  milestone?: Milestone;
  releases: Release[];
  onClose: () => void;
}) {
  const save = useSaveMilestone(projectKey);
  const toast = useToast();
  const formRef = useRef<HTMLFormElement>(null);
  const { errors, setErrors, alert, setAlert, fromError } = useServerErrors();
  const [start, setStart] = useState(milestone?.startDate ?? '');
  const [end, setEnd] = useState(milestone?.endDate ?? '');
  // Milestones go into a Planned or Active release (BR-PROJECT-26); the active one is the default.
  const choices = releases.filter((release) => release.status !== 'RELEASED');
  const defaultRelease = choices.find((release) => release.status === 'ACTIVE') ?? choices[0];

  const validDates = isoDateSchema.safeParse(start).success && isoDateSchema.safeParse(end).success;
  const days = validDates ? inclusiveDays(start, end) : null;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const fields = {
      name: form.get('name'),
      goal: String(form.get('goal') ?? '') || null,
      startDate: start || undefined,
      endDate: end || undefined,
    };
    const parsed = milestone
      ? milestoneUpdateSchema.safeParse({ ...fields, version: milestone.version })
      : milestoneCreateSchema.safeParse({ ...fields, releaseId: form.get('releaseId') });
    setAlert(null);
    if (!parsed.success) {
      setErrors(zodFieldErrors(parsed.error));
      focusFirstInvalid(formRef.current);
      return;
    }
    setErrors({});
    try {
      await save.mutateAsync({ id: milestone?.id, body: parsed.data });
      onClose();
      toast(msg('MSG-PROJECT-19'));
    } catch (error) {
      const code = error instanceof ApiRequestError ? error.code : '';
      fromError(
        error,
        code === 'MILESTONE_NAME_TAKEN' ? 'name' : DATE_CODES.has(code) ? 'endDate' : undefined,
      );
      focusFirstInvalid(formRef.current);
    }
  }

  return (
    <form ref={formRef} noValidate onSubmit={handleSubmit} className="flex flex-col gap-4">
      {alert && <Alert>{alert.text}</Alert>}
      <SelectField
        label="Release"
        name="releaseId"
        defaultValue={milestone?.releaseId ?? defaultRelease?.id}
        disabled={!!milestone}
        hint={milestone ? "A milestone can't move to another release." : undefined}
        error={errors.releaseId}
      >
        {(milestone ? releases : choices).map((release) => (
          <option key={release.id} value={release.id}>
            {release.name} ({RELEASE_STATUS_LABELS[release.status]})
          </option>
        ))}
      </SelectField>
      <TextField label="Name" name="name" defaultValue={milestone?.name} error={errors.name} />
      <TextAreaField
        label="Goal"
        name="goal"
        defaultValue={milestone?.goal ?? ''}
        error={errors.goal}
      />
      <div className="grid grid-cols-2 gap-4">
        <TextField
          label="Start date"
          type="date"
          value={start}
          onChange={(event) => setStart(event.target.value)}
          error={errors.startDate}
        />
        <TextField
          label="End date"
          type="date"
          value={end}
          onChange={(event) => setEnd(event.target.value)}
          error={errors.endDate}
        />
      </div>
      <p aria-live="polite" className="text-sm text-muted-foreground">
        {days !== null && days > 0 ? `${days} ${days === 1 ? 'day' : 'days'}` : ''}
      </p>
      <DialogActions>
        <Button type="button" variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button type="submit" disabled={save.isPending}>
          Save
        </Button>
      </DialogActions>
    </form>
  );
}

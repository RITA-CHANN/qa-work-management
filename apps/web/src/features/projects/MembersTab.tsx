import { useId, useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router';
import {
  JOB_TITLES,
  msg,
  PROJECT_ACCESS,
  type JobTitle,
  type Member,
  type MemberUpdate,
  type ProjectAccess,
} from '@qawm/shared';
import { Alert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Dialog, DialogActions } from '@/components/ui/dialog';
import { inputClass, SelectField } from '@/components/ui/field';
import { useToast } from '@/components/ui/use-toast';
import { useAddMember, useMembers, useRemoveMember, useUpdateMember, useUsers } from './api';
import { useProjectAccess } from './access';
import { ACCESS_LABELS, JOB_TITLE_NAMES } from './labels';
import { useProjectOutlet } from './project-outlet';
import { errorText } from './server-error';

/** "QA engineer (QAE)": the name, with the key people see in tables later. */
const jobTitleOption = (title: JobTitle) => `${JOB_TITLE_NAMES[title]} (${title})`;

/** SCR-PROJECT-03: who is in the project; Project admins manage members here. */
export function MembersTab() {
  const { project } = useProjectOutlet();
  const access = useProjectAccess(project);
  const members = useMembers(project.key);
  const updateMember = useUpdateMember(project.key);
  const toast = useToast();
  const [alert, setAlert] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [removing, setRemoving] = useState<Member | null>(null);
  const selfHintId = useId();

  const canManage = access.can('member:manage');
  // A Guest sees people by name only (BR-GUEST-05).
  const showEmail = access.access !== 'GUEST';
  const myId = access.me?.id;

  async function onChange(member: Member, body: MemberUpdate) {
    setAlert(null);
    try {
      await updateMember.mutateAsync({ userId: member.userId, ...body });
      toast(msg('MSG-PROJECT-19'));
    } catch (error) {
      // The select shows the saved value again, because it reads from the server data.
      setAlert(errorText(error));
    }
  }

  if (members.isError) {
    return (
      <Alert>
        {msg('MSG-COMMON-01')}
        <Button size="sm" variant="outline" onClick={() => void members.refetch()}>
          Try again
        </Button>
      </Alert>
    );
  }
  const rows = members.data ?? [];

  return (
    <section aria-labelledby="members-heading">
      <div className="mb-4 flex items-center justify-between">
        <h2 id="members-heading" className="text-lg font-semibold">
          Members ({rows.length})
        </h2>
        {canManage && <Button onClick={() => setAdding(true)}>Add member</Button>}
      </div>
      {alert && <Alert className="mb-4">{alert}</Alert>}
      <p id={selfHintId} className="sr-only">
        {msg('MSG-PROJECT-22')}
      </p>
      <table className="w-full text-sm" aria-busy={members.isPending}>
        <caption className="sr-only">Project members</caption>
        <thead className="border-b text-left text-muted-foreground">
          <tr>
            <th scope="col" className="py-2 pr-4 font-medium">
              Name
            </th>
            {showEmail && (
              <th scope="col" className="py-2 pr-4 font-medium">
                Email
              </th>
            )}
            <th scope="col" className="py-2 pr-4 font-medium">
              Access
            </th>
            <th scope="col" className="py-2 pr-4 font-medium">
              Job title
            </th>
            <th scope="col" className="py-2 font-medium">
              <span className="sr-only">Actions</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((member) => {
            const isMe = member.userId === myId;
            return (
              <tr key={member.userId} className="border-b last:border-0">
                <td className="py-2 pr-4">
                  {member.name}
                  {isMe && <span className="text-muted-foreground"> (you)</span>}
                </td>
                {showEmail && <td className="py-2 pr-4">{member.email}</td>}
                <td className="py-2 pr-4">
                  {canManage && !isMe ? (
                    <select
                      aria-label={`Access of ${member.name}`}
                      value={member.access}
                      disabled={updateMember.isPending}
                      onChange={(event) =>
                        void onChange(member, { access: event.target.value as ProjectAccess })
                      }
                      className={`${inputClass} w-40`}
                    >
                      {PROJECT_ACCESS.map((level) => (
                        <option key={level} value={level}>
                          {ACCESS_LABELS[level]}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <span aria-describedby={isMe && canManage ? selfHintId : undefined}>
                      {ACCESS_LABELS[member.access]}
                    </span>
                  )}
                </td>
                <td className="py-2 pr-4">
                  {canManage ? (
                    <select
                      aria-label={`Job title of ${member.name}`}
                      value={member.jobTitle ?? ''}
                      disabled={updateMember.isPending}
                      onChange={(event) =>
                        void onChange(member, {
                          jobTitle: (event.target.value || null) as JobTitle | null,
                        })
                      }
                      className={`${inputClass} w-52`}
                    >
                      <option value="">—</option>
                      {JOB_TITLES.map((title) => (
                        <option key={title} value={title}>
                          {jobTitleOption(title)}
                        </option>
                      ))}
                    </select>
                  ) : member.jobTitle ? (
                    `${JOB_TITLE_NAMES[member.jobTitle]} · ${member.jobTitle}`
                  ) : (
                    '—'
                  )}
                </td>
                <td className="py-2 text-right">
                  {isMe && !access.archived && (
                    <Button size="sm" variant="outline" onClick={() => setRemoving(member)}>
                      Leave
                    </Button>
                  )}
                  {canManage && !isMe && (
                    <Button
                      size="sm"
                      variant="outline"
                      aria-label={`Remove ${member.name}`}
                      onClick={() => setRemoving(member)}
                    >
                      Remove
                    </Button>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      <AddMemberDialog
        open={adding}
        onClose={() => setAdding(false)}
        projectKey={project.key}
        members={rows}
      />
      <RemoveMemberDialog
        projectKey={project.key}
        member={removing}
        leaving={removing?.userId === myId}
        onClose={() => setRemoving(null)}
      />
    </section>
  );
}

function AddMemberDialog({
  open,
  onClose,
  projectKey,
  members,
}: {
  open: boolean;
  onClose: () => void;
  projectKey: string;
  members: Member[];
}) {
  const users = useUsers(open);
  const add = useAddMember(projectKey);
  const toast = useToast();
  const [error, setError] = useState<string | null>(null);
  const [userError, setUserError] = useState<string | undefined>();
  // Existing members are not offered (AC-PROJECT-24).
  const memberIds = new Set(members.map((member) => member.userId));
  const candidates = (users.data ?? []).filter((user) => !memberIds.has(user.id));

  function close() {
    setError(null);
    setUserError(undefined);
    add.reset();
    onClose();
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const userId = String(form.get('userId') ?? '');
    const access = String(form.get('access')) as ProjectAccess;
    const jobTitle = (String(form.get('jobTitle') ?? '') || null) as JobTitle | null;
    setError(null);
    if (!userId) {
      setUserError('Choose a user');
      return;
    }
    setUserError(undefined);
    try {
      await add.mutateAsync({ userId, access, jobTitle });
      close();
      toast(msg('MSG-PROJECT-19'));
    } catch (failure) {
      setError(errorText(failure));
    }
  }

  return (
    <Dialog open={open} onClose={close} title="Add member">
      <form noValidate onSubmit={handleSubmit} className="flex flex-col gap-4">
        {error && <Alert>{error}</Alert>}
        <SelectField label="User" name="userId" defaultValue="" error={userError}>
          <option value="" disabled>
            {users.isPending ? 'Loading…' : 'Choose a user'}
          </option>
          {candidates.map((user) => (
            <option key={user.id} value={user.id}>
              {user.name} ({user.email})
            </option>
          ))}
        </SelectField>
        <SelectField label="Access" name="access" defaultValue="MEMBER">
          {PROJECT_ACCESS.map((level) => (
            <option key={level} value={level}>
              {ACCESS_LABELS[level]}
            </option>
          ))}
        </SelectField>
        <SelectField label="Job title" name="jobTitle" defaultValue="">
          <option value="">—</option>
          {JOB_TITLES.map((title) => (
            <option key={title} value={title}>
              {jobTitleOption(title)}
            </option>
          ))}
        </SelectField>
        <DialogActions>
          <Button type="button" variant="outline" onClick={close}>
            Cancel
          </Button>
          <Button type="submit" disabled={add.isPending}>
            Add
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}

function RemoveMemberDialog({
  projectKey,
  member,
  leaving,
  onClose,
}: {
  projectKey: string;
  member: Member | null;
  leaving: boolean;
  onClose: () => void;
}) {
  const remove = useRemoveMember(projectKey);
  const navigate = useNavigate();
  const toast = useToast();
  const [error, setError] = useState<string | null>(null);

  function close() {
    setError(null);
    onClose();
  }

  async function confirm() {
    if (!member) return;
    setError(null);
    try {
      await remove.mutateAsync(member.userId);
      close();
      toast(msg('MSG-PROJECT-19'));
      if (leaving) void navigate('/projects');
    } catch (failure) {
      setError(errorText(failure));
    }
  }

  return (
    <Dialog
      open={!!member}
      onClose={close}
      role="alertdialog"
      title={leaving ? 'Leave project?' : `Remove ${member?.name ?? ''}?`}
      description={
        leaving
          ? 'You will no longer see this project.'
          : `${member?.name ?? ''} will no longer see this project.`
      }
    >
      {error && <Alert>{error}</Alert>}
      <DialogActions>
        <Button variant="outline" onClick={close}>
          Cancel
        </Button>
        <Button variant="destructive" onClick={() => void confirm()} disabled={remove.isPending}>
          {leaving ? 'Leave' : 'Remove'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

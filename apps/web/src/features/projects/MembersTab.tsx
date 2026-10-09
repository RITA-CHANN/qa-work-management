import { useId, useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router';
import { msg, PROJECT_ROLES, type Member, type ProjectRole } from '@qawm/shared';
import { Alert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Dialog, DialogActions } from '@/components/ui/dialog';
import { inputClass, SelectField } from '@/components/ui/field';
import { useToast } from '@/components/ui/use-toast';
import { useAddMember, useChangeRole, useMembers, useRemoveMember, useUsers } from './api';
import { useProjectAccess } from './access';
import { ROLE_LABELS } from './labels';
import { useProjectOutlet } from './project-outlet';
import { errorText } from './server-error';

/** SCR-PROJECT-03: who is in the project; Owner, PM and QA lead manage members here. */
export function MembersTab() {
  const { project } = useProjectOutlet();
  const access = useProjectAccess(project);
  const members = useMembers(project.key);
  const changeRole = useChangeRole(project.key);
  const toast = useToast();
  const [alert, setAlert] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [removing, setRemoving] = useState<Member | null>(null);
  const ownerHintId = useId();
  const selfHintId = useId();

  const canManage = access.can('member:manage');
  const canManageOwners = access.can('member:manage-owner');
  // Roles this user may give: "Owner" only for Owners and Admins (BR-PROJECT-23).
  const offeredRoles = PROJECT_ROLES.filter((role) => role !== 'OWNER' || canManageOwners);
  const myId = access.me?.id;

  async function onRoleChange(member: Member, role: ProjectRole) {
    setAlert(null);
    try {
      await changeRole.mutateAsync({ userId: member.userId, role });
      toast(msg('MSG-PROJECT-19'));
    } catch (error) {
      // The select shows the saved role again, because it reads from the server data.
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
      <p id={ownerHintId} className="sr-only">
        Only an Owner can change an Owner&apos;s role
      </p>
      <p id={selfHintId} className="sr-only">
        You can&apos;t change your own role
      </p>
      <table className="w-full text-sm" aria-busy={members.isPending}>
        <caption className="sr-only">Project members</caption>
        <thead className="border-b text-left text-muted-foreground">
          <tr>
            <th scope="col" className="py-2 pr-4 font-medium">
              Name
            </th>
            <th scope="col" className="py-2 pr-4 font-medium">
              Email
            </th>
            <th scope="col" className="py-2 pr-4 font-medium">
              Role
            </th>
            <th scope="col" className="py-2 font-medium">
              <span className="sr-only">Actions</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((member) => {
            const isMe = member.userId === myId;
            const ownerLocked = member.role === 'OWNER' && !canManageOwners;
            const editable = canManage && !isMe && !ownerLocked;
            return (
              <tr key={member.userId} className="border-b last:border-0">
                <td className="py-2 pr-4">
                  {member.name}
                  {isMe && <span className="text-muted-foreground"> (you)</span>}
                </td>
                <td className="py-2 pr-4">{member.email}</td>
                <td className="py-2 pr-4">
                  {canManage && !isMe ? (
                    <select
                      aria-label={`Role of ${member.name}`}
                      value={member.role}
                      disabled={!editable || changeRole.isPending}
                      aria-describedby={ownerLocked ? ownerHintId : undefined}
                      onChange={(event) =>
                        void onRoleChange(member, event.target.value as ProjectRole)
                      }
                      className={`${inputClass} w-44`}
                    >
                      {(editable ? offeredRoles : PROJECT_ROLES).map((role) => (
                        <option key={role} value={role}>
                          {ROLE_LABELS[role]}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <span aria-describedby={isMe && canManage ? selfHintId : undefined}>
                      {ROLE_LABELS[member.role]}
                    </span>
                  )}
                </td>
                <td className="py-2 text-right">
                  {isMe && !access.archived && (
                    <Button size="sm" variant="outline" onClick={() => setRemoving(member)}>
                      Leave
                    </Button>
                  )}
                  {editable && (
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
        roles={offeredRoles}
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
  roles,
}: {
  open: boolean;
  onClose: () => void;
  projectKey: string;
  members: Member[];
  roles: readonly ProjectRole[];
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
    const role = String(form.get('role')) as ProjectRole;
    setError(null);
    if (!userId) {
      setUserError('Choose a user');
      return;
    }
    setUserError(undefined);
    try {
      await add.mutateAsync({ userId, role });
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
        <SelectField label="Role" name="role" defaultValue="VIEWER">
          {roles.map((role) => (
            <option key={role} value={role}>
              {ROLE_LABELS[role]}
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

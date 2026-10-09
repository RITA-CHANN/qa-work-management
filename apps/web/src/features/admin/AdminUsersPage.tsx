import { useState, type FormEvent } from 'react';
import { useSearchParams } from 'react-router';
import {
  adminUserCreateSchema,
  ACCESS_LABELS,
  GLOBAL_ROLE_LABELS,
  JOB_TITLE_NAMES,
  msg,
  USER_STATUS_LABELS,
  type GlobalRole,
  type UserStatus,
} from '@qawm/shared';
import { EmptyState } from '@/components/EmptyState';
import { PageHeader } from '@/components/PageHeader';
import { Alert } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Dialog, DialogActions } from '@/components/ui/dialog';
import { SelectField, TextField } from '@/components/ui/field';
import { useToast } from '@/components/ui/use-toast';
import { useMe } from '@/features/auth/use-me';
import { errorText } from '@/features/projects/server-error';
import { ApiRequestError } from '@/lib/api-client';
import { cn } from '@/lib/utils';
import {
  useAdminUser,
  useAdminUsers,
  useChangeGlobalRole,
  useCreateUser,
  useResetPassword,
  useUserAction,
} from './api';
import { formatDateTime, tableClass, tdClass, thClass } from './format';
import { OneTimePasswordDialog } from './OneTimePasswordDialog';

/** SCR-ADMIN-03 Users (BR-ADMIN-06..13): list on the left, the selected user's details on the right. */
export function AdminUsersPage() {
  const [params, setParams] = useSearchParams();
  const selected = params.get('user');
  const [search, setSearch] = useState('');
  const [role, setRole] = useState<GlobalRole | ''>('');
  const [status, setStatus] = useState<UserStatus | ''>('');
  const [creating, setCreating] = useState(false);
  const users = useAdminUsers({ search, role: role || undefined, status: status || undefined });
  const select = (id: string) => setParams({ user: id });

  return (
    <>
      <PageHeader
        title="Users"
        description="Accounts, global roles and access"
        actions={<Button onClick={() => setCreating(true)}>New user</Button>}
      />
      <div className="grid gap-5 xl:grid-cols-[1fr_380px]">
        <Card>
          <div className="mb-4 flex flex-wrap items-end gap-3">
            <TextField
              label="Search users"
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Name or email"
              className="w-64"
            />
            <SelectField
              label="Global role"
              value={role}
              onChange={(e) => setRole(e.target.value as GlobalRole | '')}
              className="w-36"
            >
              <option value="">All</option>
              <option value="ADMIN">Admin</option>
              <option value="USER">User</option>
            </SelectField>
            <SelectField
              label="Status"
              value={status}
              onChange={(e) => setStatus(e.target.value as UserStatus | '')}
              className="w-40"
            >
              <option value="">All</option>
              <option value="ACTIVE">Active</option>
              <option value="DEACTIVATED">Deactivated</option>
            </SelectField>
          </div>
          {users.isError && <Alert>{errorText(users.error)}</Alert>}
          {users.data?.length === 0 && <EmptyState title="No users match your search" />}
          {!!users.data?.length && (
            <div className="overflow-x-auto">
              <table className={tableClass}>
                <caption className="sr-only">Users</caption>
                <thead>
                  <tr>
                    <th className={thClass}>Name</th>
                    <th className={thClass}>Global role</th>
                    <th className={thClass}>Status</th>
                    <th className={thClass}>Projects</th>
                    <th className={thClass}>Last sign-in</th>
                  </tr>
                </thead>
                <tbody>
                  {users.data.map((u) => (
                    <tr key={u.id} className={cn(u.id === selected && 'bg-primary-tint/60')}>
                      <td className={tdClass}>
                        <button
                          type="button"
                          onClick={() => select(u.id)}
                          aria-current={u.id === selected ? 'true' : undefined}
                          className="text-left"
                        >
                          <span className="block font-semibold hover:underline">{u.name}</span>
                          <span className="block text-xs text-muted-foreground">{u.email}</span>
                        </button>
                      </td>
                      <td className={tdClass}>
                        <Badge tone={u.globalRole === 'ADMIN' ? 'admin' : 'neutral'}>
                          {GLOBAL_ROLE_LABELS[u.globalRole]}
                        </Badge>
                      </td>
                      <td className={tdClass}>
                        <Badge tone={u.status === 'ACTIVE' ? 'active' : 'warning'}>
                          {USER_STATUS_LABELS[u.status]}
                        </Badge>
                      </td>
                      <td className={`${tdClass} font-mono`}>{u.projectCount}</td>
                      <td className={`${tdClass} text-muted-foreground`}>
                        {u.lastSignInAt ? formatDateTime(u.lastSignInAt) : 'Never'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
        {selected ? (
          <UserPanel id={selected} />
        ) : (
          <Card>
            <p className="text-muted-foreground">Select a user to see their details.</p>
          </Card>
        )}
      </div>
      {creating && <CreateUserDialog onClose={() => setCreating(false)} onCreated={select} />}
    </>
  );
}

/** Details and actions of one user (BR-ADMIN-08, 10, 12, 13). */
function UserPanel({ id }: { id: string }) {
  const user = useAdminUser(id);
  const { data: me } = useMe();
  const changeRole = useChangeGlobalRole(id);
  const act = useUserAction(id);
  const reset = useResetPassword(id);
  const toast = useToast();
  const [error, setError] = useState<string | null>(null);
  const [otp, setOtp] = useState<string | null>(null);
  const [confirm, setConfirm] = useState<'deactivate' | 'reset' | null>(null);

  if (user.isError) return <Alert>{errorText(user.error)}</Alert>;
  if (!user.data)
    return (
      <Card>
        <p role="status">Loading…</p>
      </Card>
    );
  const u = user.data;
  const self = me?.id === u.id;

  async function run(work: () => Promise<unknown>) {
    setError(null);
    try {
      await work();
      toast(msg('MSG-PROJECT-19'));
    } catch (e) {
      setError(errorText(e));
    }
  }

  return (
    <Card title={u.name} className="self-start">
      <div className="flex flex-col gap-4">
        <p className="-mt-3 text-muted-foreground">{u.email}</p>
        {error && <Alert>{error}</Alert>}
        <SelectField
          label="Global role"
          value={u.globalRole}
          disabled={self || changeRole.isPending}
          hint={self ? msg('MSG-ADMIN-04') : undefined}
          onChange={(e) => void run(() => changeRole.mutateAsync(e.target.value as GlobalRole))}
        >
          <option value="USER">User</option>
          <option value="ADMIN">Admin</option>
        </SelectField>
        <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2">
          <dt className="text-muted-foreground">Status</dt>
          <dd>
            <Badge tone={u.status === 'ACTIVE' ? 'active' : 'warning'}>
              {USER_STATUS_LABELS[u.status]}
            </Badge>
            {u.mustChangePassword && <Badge className="ml-2">Must set a password</Badge>}
          </dd>
          <dt className="text-muted-foreground">Signed in on</dt>
          <dd>
            {u.activeSessions} {u.activeSessions === 1 ? 'device' : 'devices'}
          </dd>
          <dt className="text-muted-foreground">Last sign-in</dt>
          <dd>{u.lastSignInAt ? formatDateTime(u.lastSignInAt) : 'Never'}</dd>
        </dl>
        <section aria-labelledby={`projects-${u.id}`}>
          <h3 id={`projects-${u.id}`} className="mb-2 font-semibold">
            Projects
          </h3>
          {u.projects.length ? (
            <ul className="flex flex-col gap-1.5">
              {u.projects.map((p) => (
                <li key={p.key} className="flex justify-between gap-2">
                  <span>
                    {p.name}{' '}
                    <span className="font-mono text-xs text-muted-foreground">{p.key}</span>
                    {p.archived && (
                      <Badge tone="warning" className="ml-2">
                        Archived
                      </Badge>
                    )}
                  </span>
                  <span className="text-muted-foreground">
                    {ACCESS_LABELS[p.access]}
                    {p.jobTitle && ` · ${JOB_TITLE_NAMES[p.jobTitle]}`}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-muted-foreground">Not in any project</p>
          )}
        </section>
        <div className="flex flex-wrap gap-2 border-t pt-4">
          <Button variant="outline" size="sm" onClick={() => setConfirm('reset')}>
            Reset password
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => void run(() => act.mutateAsync('sign-out'))}
          >
            Sign out everywhere
          </Button>
          {!self &&
            (u.status === 'ACTIVE' ? (
              <Button variant="destructive" size="sm" onClick={() => setConfirm('deactivate')}>
                Deactivate
              </Button>
            ) : (
              <Button
                variant="outline"
                size="sm"
                onClick={() => void run(() => act.mutateAsync('reactivate'))}
              >
                Reactivate
              </Button>
            ))}
        </div>
      </div>
      {confirm && (
        <Dialog
          open
          role="alertdialog"
          onClose={() => setConfirm(null)}
          title={confirm === 'reset' ? `Reset ${u.name}'s password?` : `Deactivate ${u.name}?`}
          description={
            confirm === 'reset'
              ? 'They are signed out everywhere and must set a new password at the next sign-in.'
              : 'They are signed out everywhere and cannot sign in until reactivated.'
          }
        >
          <DialogActions>
            <Button variant="outline" onClick={() => setConfirm(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                const which = confirm;
                setConfirm(null);
                void run(async () => {
                  if (which === 'reset') setOtp((await reset.mutateAsync()).oneTimePassword);
                  else await act.mutateAsync('deactivate');
                });
              }}
            >
              {confirm === 'reset' ? 'Reset password' : 'Deactivate'}
            </Button>
          </DialogActions>
        </Dialog>
      )}
      {otp && <OneTimePasswordDialog email={u.email} password={otp} onClose={() => setOtp(null)} />}
    </Card>
  );
}

type CreateErrors = { name?: string; email?: string; form?: string };

/** BR-ADMIN-07 */
function CreateUserDialog({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: (id: string) => void;
}) {
  const create = useCreateUser();
  const [errors, setErrors] = useState<CreateErrors>({});
  const [result, setResult] = useState<{ email: string; password: string; id: string } | null>(
    null,
  );

  if (result) {
    return (
      <OneTimePasswordDialog
        email={result.email}
        password={result.password}
        onClose={() => {
          onCreated(result.id);
          onClose();
        }}
      />
    );
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const parsed = adminUserCreateSchema.safeParse({
      name: form.get('name'),
      email: form.get('email'),
      globalRole: form.get('globalRole'),
    });
    if (!parsed.success) {
      const next: CreateErrors = {};
      for (const issue of parsed.error.issues) {
        const field = issue.path[0] as 'name' | 'email';
        next[field] ??= issue.message;
      }
      setErrors(next);
      return;
    }
    setErrors({});
    try {
      const created = await create.mutateAsync(parsed.data);
      setResult({
        email: created.user.email,
        password: created.oneTimePassword,
        id: created.user.id,
      });
    } catch (error) {
      if (error instanceof ApiRequestError && error.code === 'EMAIL_TAKEN') {
        setErrors({ email: error.message });
      } else if (error instanceof ApiRequestError && error.errors.length) {
        setErrors({ name: error.fieldError('/name'), email: error.fieldError('/email') });
      } else {
        setErrors({ form: errorText(error) });
      }
    }
  }

  return (
    <Dialog open onClose={onClose} title="New user">
      <form noValidate onSubmit={onSubmit} className="flex flex-col gap-4">
        {errors.form && <Alert>{errors.form}</Alert>}
        <TextField label="Name" name="name" autoComplete="off" error={errors.name} />
        <TextField
          label="Email"
          name="email"
          type="email"
          autoComplete="off"
          error={errors.email}
        />
        <SelectField label="Global role" name="globalRole" defaultValue="USER">
          <option value="USER">User</option>
          <option value="ADMIN">Admin</option>
        </SelectField>
        <DialogActions>
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={create.isPending}>
            Create user
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}

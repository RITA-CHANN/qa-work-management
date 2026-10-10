import { useId, useRef, useState, type FormEvent, type ReactNode } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import {
  JOB_TITLES,
  msg,
  PROJECT_ACCESS,
  type JobTitle,
  type Member,
  type MemberUpdate,
  type ProjectAccess,
  type UserOption,
} from '@qawm/shared';
import { Alert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Dialog, DialogActions } from '@/components/ui/dialog';
import { inputClass, SelectField, TextField } from '@/components/ui/field';
import { useToast } from '@/components/ui/use-toast';
import { useMediaQuery } from '@/lib/use-media-query';
import { cn } from '@/lib/utils';
import { useAddMember, useMembers, useRemoveMember, useUpdateMember } from './api';
import { useProjectAccess } from './access';
import { ACCESS_LABELS, formatDate, JOB_TITLE_NAMES } from './labels';
import { useProjectOutlet } from './project-outlet';
import { errorText } from './server-error';
import { UserPicker } from './UserPicker';

/** "QA engineer (QAE)": the name, with the key people see in tables later. */
const jobTitleOption = (title: JobTitle) => `${JOB_TITLE_NAMES[title]} (${title})`;
const jobTitleText = (title: JobTitle | null) =>
  title ? `${JOB_TITLE_NAMES[title]} · ${title}` : '—';

/** A confirmation the screen is showing: remove someone, leave, or step down to Member. */
type Pending = { kind: 'remove' | 'leave' | 'stepDown'; member: Member };

/** BR-PROJECT-40: the filter box matches name, email (when shown) and job title, ignoring case. */
function matches(member: Member, text: string): boolean {
  if (!text) return true;
  const title = member.jobTitle ? `${member.jobTitle} ${JOB_TITLE_NAMES[member.jobTitle]}` : '';
  return [member.name, member.email ?? '', title].some((field) =>
    field.toLowerCase().includes(text),
  );
}

/** SCR-PROJECT-03: who is in the project; Project admins manage members here. */
export function MembersTab() {
  const { project } = useProjectOutlet();
  const access = useProjectAccess(project);
  const members = useMembers(project.key);
  const updateMember = useUpdateMember(project.key);
  const toast = useToast();
  const wide = useMediaQuery('(min-width: 768px)');
  const [params, setParams] = useSearchParams();
  const [alert, setAlert] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [pending, setPending] = useState<Pending | null>(null);
  const selects = useRef(new Map<string, HTMLSelectElement>());
  const selfHintId = useId();

  const canManage = access.can('member:manage');
  // A Guest sees people by name only (BR-GUEST-05).
  const showEmail = access.access !== 'GUEST';
  const myId = access.me?.id;

  // Filters live in the address, so a reload or a shared link keeps them (BR-PROJECT-40).
  const filterText = params.get('q') ?? '';
  const accessParam = params.get('access');
  const accessFilter = (PROJECT_ACCESS as readonly string[]).includes(accessParam ?? '')
    ? (accessParam as ProjectAccess)
    : null;
  const setFilter = (name: string, value: string) => {
    const next = new URLSearchParams(window.location.search);
    if (value) next.set(name, value);
    else next.delete(name);
    setParams(next, { replace: true });
  };

  async function onChange(member: Member, body: MemberUpdate, select: string) {
    setAlert(null);
    try {
      await updateMember.mutateAsync({ userId: member.userId, ...body });
      toast(msg('MSG-PROJECT-19'));
    } catch (error) {
      // The select shows the saved value again, because it reads from the server data.
      setAlert(errorText(error));
      selects.current.get(select)?.focus();
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
  const adminCount = rows.filter((member) => member.access === 'PROJECT_ADMIN').length;
  const text = filterText.trim().toLowerCase();
  const shown = rows.filter(
    (member) => (!accessFilter || member.access === accessFilter) && matches(member, text),
  );
  const filtered = Boolean(text || accessFilter);
  const selectRef = (key: string) => (element: HTMLSelectElement | null) => {
    if (element) selects.current.set(key, element);
    else selects.current.delete(key);
  };

  /** The access, job title and action controls of one member, laid out by the table or the card. */
  function controls(member: Member) {
    const isMe = member.userId === myId;
    const accessCell =
      canManage && !isMe ? (
        <select
          ref={selectRef(`${member.userId}-access`)}
          aria-label={`Access of ${member.name}`}
          value={member.access}
          onChange={(event) =>
            void onChange(
              member,
              { access: event.target.value as ProjectAccess },
              `${member.userId}-access`,
            )
          }
          className={cn(inputClass, wide ? 'w-40' : 'w-full')}
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
      );
    const jobTitleCell = canManage ? (
      <select
        ref={selectRef(`${member.userId}-jobTitle`)}
        aria-label={`Job title of ${member.name}`}
        value={member.jobTitle ?? ''}
        onChange={(event) =>
          void onChange(
            member,
            { jobTitle: (event.target.value || null) as JobTitle | null },
            `${member.userId}-jobTitle`,
          )
        }
        className={cn(inputClass, wide ? 'w-52' : 'w-full')}
      >
        <option value="">—</option>
        {JOB_TITLES.map((title) => (
          <option key={title} value={title}>
            {jobTitleOption(title)}
          </option>
        ))}
      </select>
    ) : (
      jobTitleText(member.jobTitle)
    );
    const actions = (
      <div className={cn('flex justify-end gap-2', !wide && 'flex-wrap')}>
        {/* A Project admin may step down while another one remains (BR-PROJECT-24). */}
        {isMe && canManage && member.access === 'PROJECT_ADMIN' && (
          <Button
            size="sm"
            variant="outline"
            onClick={() => setPending({ kind: 'stepDown', member })}
          >
            Step down to Member
          </Button>
        )}
        {isMe && !access.archived && (
          <Button size="sm" variant="outline" onClick={() => setPending({ kind: 'leave', member })}>
            Leave
          </Button>
        )}
        {canManage && !isMe && (
          <Button
            size="sm"
            variant="outline"
            aria-label={`Remove ${member.name}`}
            onClick={() => setPending({ kind: 'remove', member })}
          >
            Remove
          </Button>
        )}
      </div>
    );
    const name = (
      <>
        {member.name}
        {isMe && <span className="text-muted-foreground"> (you)</span>}
      </>
    );
    return { name, accessCell, jobTitleCell, actions, added: formatDate(member.addedAt) };
  }

  const counts = (level: ProjectAccess | null) =>
    level ? rows.filter((member) => member.access === level).length : rows.length;
  const chips: (ProjectAccess | null)[] = [null, ...PROJECT_ACCESS];

  return (
    <section aria-labelledby="members-heading">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 id="members-heading" className="text-lg font-semibold">
          {members.isPending ? 'Members' : `Members (${rows.length})`}
        </h2>
        {canManage && <Button onClick={() => setAdding(true)}>Add member</Button>}
      </div>

      <div className="mb-4 flex flex-wrap items-end gap-3">
        <TextField
          label="Filter members"
          type="search"
          placeholder={showEmail ? 'Name, email or job title' : 'Name or job title'}
          value={filterText}
          onChange={(event) => setFilter('q', event.target.value)}
          className="w-full sm:w-72"
        />
        <div role="group" aria-label="Access level" className="flex flex-wrap gap-2">
          {chips.map((level) => {
            const label = level ? ACCESS_LABELS[level] : 'All';
            const selected = accessFilter === level;
            return (
              <button
                key={level ?? 'all'}
                type="button"
                aria-pressed={selected}
                onClick={() => setFilter('access', level ?? '')}
                className={cn(
                  'h-8 rounded-full border px-3 text-sm font-medium transition-colors focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none',
                  selected
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'bg-card hover:bg-accent',
                )}
              >
                {label}{' '}
                <span className={selected ? 'opacity-80' : 'text-muted-foreground'}>
                  ({members.isPending ? '…' : counts(level)})
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {alert && <Alert className="mb-4">{alert}</Alert>}
      <p id={selfHintId} className="sr-only">
        {msg('MSG-PROJECT-22')}
      </p>
      {filtered && members.isSuccess && (
        <p role="status" className="mb-2 text-sm text-muted-foreground">
          {shown.length === 0 ? (
            <>
              {msg('MSG-PROJECT-43')}{' '}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setParams({}, { replace: true })}
                className="ml-1"
              >
                Clear filters
              </Button>
            </>
          ) : (
            `Showing ${shown.length} of ${rows.length}`
          )}
        </p>
      )}

      {members.isPending ? (
        <div className="flex flex-col gap-3" aria-busy="true" aria-label="Loading members">
          {[0, 1, 2, 3].map((n) => (
            <div key={n} className="h-10 animate-pulse rounded-md bg-muted" />
          ))}
        </div>
      ) : wide ? (
        <table className="w-full text-sm">
          <caption className="sr-only">Project members</caption>
          <thead className="border-b text-left text-muted-foreground">
            <tr>
              <Th>Name</Th>
              {showEmail && <Th>Email</Th>}
              <Th>Access</Th>
              <Th>Job title</Th>
              <Th>Added</Th>
              <th scope="col" className="py-2 font-medium">
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {shown.map((member) => {
              const c = controls(member);
              return (
                <tr key={member.userId} className="border-b last:border-0">
                  <td className="py-2 pr-4">{c.name}</td>
                  {showEmail && <td className="py-2 pr-4">{member.email}</td>}
                  <td className="py-2 pr-4">{c.accessCell}</td>
                  <td className="py-2 pr-4">{c.jobTitleCell}</td>
                  <td className="py-2 pr-4 whitespace-nowrap">{c.added}</td>
                  <td className="py-2">{c.actions}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      ) : (
        // Below 768 px each member is a card (SCR-PROJECT-03 §Responsive).
        <ul aria-label="Project members" className="flex flex-col gap-3">
          {shown.map((member) => {
            const c = controls(member);
            return (
              <li key={member.userId} className="rounded-lg border bg-card p-4 text-sm">
                <p className="font-medium">{c.name}</p>
                {showEmail && <p className="break-all text-muted-foreground">{member.email}</p>}
                <dl className="mt-3 grid grid-cols-[auto_minmax(0,1fr)] items-center gap-x-3 gap-y-2">
                  <CardTerm>Access</CardTerm>
                  <dd>{c.accessCell}</dd>
                  <CardTerm>Job title</CardTerm>
                  <dd>{c.jobTitleCell}</dd>
                  <CardTerm>Added</CardTerm>
                  <dd>{c.added}</dd>
                </dl>
                <div className="mt-3">{c.actions}</div>
              </li>
            );
          })}
        </ul>
      )}

      <AddMemberDialog
        open={adding}
        onClose={() => setAdding(false)}
        projectKey={project.key}
        members={rows}
      />
      <ConfirmMemberDialog
        projectKey={project.key}
        pending={pending}
        lastAdmin={pending?.member.access === 'PROJECT_ADMIN' && adminCount === 1}
        onClose={() => setPending(null)}
      />
    </section>
  );
}

function Th({ children }: { children: ReactNode }) {
  return (
    <th scope="col" className="py-2 pr-4 font-medium">
      {children}
    </th>
  );
}

function CardTerm({ children }: { children: ReactNode }) {
  return <dt className="text-xs font-medium text-muted-foreground">{children}</dt>;
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
  const add = useAddMember(projectKey);
  const toast = useToast();
  const [user, setUser] = useState<UserOption | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [userError, setUserError] = useState<string | undefined>();
  // Existing members are listed but can't be picked (AC-PROJECT-24).
  const unavailable = new Map(members.map((member) => [member.userId, 'Already a member']));

  function close() {
    setUser(null);
    setError(null);
    setUserError(undefined);
    add.reset();
    onClose();
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const access = String(form.get('access')) as ProjectAccess;
    const jobTitle = (String(form.get('jobTitle') ?? '') || null) as JobTitle | null;
    setError(null);
    if (!user) {
      setUserError(msg('MSG-PROJECT-40'));
      return;
    }
    setUserError(undefined);
    try {
      await add.mutateAsync({ userId: user.id, access, jobTitle });
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
        <UserPicker
          label="User"
          value={user}
          onChange={(next) => {
            setUser(next);
            if (next) setUserError(undefined);
          }}
          unavailable={unavailable}
          error={userError}
        />
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

const CONFIRM = {
  remove: { title: (name: string) => `Remove ${name}?`, button: 'Remove' },
  leave: { title: () => 'Leave project?', button: 'Leave' },
  stepDown: { title: () => 'Step down to Member?', button: 'Step down' },
} as const;

/**
 * Remove someone, leave, or step down to Member. When the change would leave the project without a Project
 * admin, the dialog says so up front and its button is disabled (BR-PROJECT-12, AC-PROJECT-27).
 */
function ConfirmMemberDialog({
  projectKey,
  pending,
  lastAdmin,
  onClose,
}: {
  projectKey: string;
  pending: Pending | null;
  lastAdmin: boolean;
  onClose: () => void;
}) {
  const remove = useRemoveMember(projectKey);
  const update = useUpdateMember(projectKey);
  const navigate = useNavigate();
  const toast = useToast();
  const [error, setError] = useState<string | null>(null);
  const busy = remove.isPending || update.isPending;

  function close() {
    setError(null);
    onClose();
  }

  async function confirm() {
    if (!pending) return;
    setError(null);
    try {
      if (pending.kind === 'stepDown') {
        await update.mutateAsync({ userId: pending.member.userId, access: 'MEMBER' });
      } else {
        await remove.mutateAsync(pending.member.userId);
      }
      close();
      toast(msg('MSG-PROJECT-19'));
      if (pending.kind === 'leave') void navigate('/projects');
    } catch (failure) {
      setError(errorText(failure));
    }
  }

  const kind = pending?.kind ?? 'remove';
  const name = pending?.member.name ?? '';
  const description = lastAdmin
    ? msg('MSG-PROJECT-12')
    : kind === 'stepDown'
      ? msg('MSG-PROJECT-42')
      : msg('MSG-PROJECT-41', { name: kind === 'leave' ? 'You' : name });

  return (
    <Dialog
      open={!!pending}
      onClose={close}
      role="alertdialog"
      title={CONFIRM[kind].title(name)}
      description={description}
    >
      {error && <Alert>{error}</Alert>}
      <DialogActions>
        <Button variant="outline" onClick={close}>
          Cancel
        </Button>
        <Button variant="destructive" onClick={() => void confirm()} disabled={busy || lastAdmin}>
          {CONFIRM[kind].button}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

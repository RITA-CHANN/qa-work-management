import { useState } from 'react';
import { ChevronDown, ChevronRight, MoreHorizontal } from 'lucide-react';
import {
  msg,
  type Milestone,
  type MilestoneStatus,
  type Release,
  type ReleaseStatus,
} from '@qawm/shared';
import { Alert } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogActions } from '@/components/ui/dialog';
import { Menu, type MenuItem } from '@/components/ui/menu';
import { useToast } from '@/components/ui/use-toast';
import {
  useDeleteMilestone,
  useDeleteRelease,
  useMilestones,
  useReleases,
  useSaveMilestone,
  useSaveRelease,
} from './api';
import { useProjectAccess } from './access';
import { MILESTONE_STATUS_LABELS, RELEASE_STATUS_LABELS } from './labels';
import { timeLeft, toTarget } from './milestone-time';
import { MilestoneDialog, ReleaseDialog } from './PlanDialogs';
import { useProjectOutlet } from './project-outlet';
import { errorText, isConflict } from './server-error';

/** The UI says "sprint" for a milestone (BR-PROJECT-47). */
type Editing =
  | { kind: 'release'; release?: Release }
  | { kind: 'sprint'; milestone?: Milestone; releaseId?: string }
  | null;
type Deleting = { kind: 'release'; item: Release } | { kind: 'sprint'; item: Milestone } | null;
/** A status move waiting for the user's confirmation (BR-PROJECT-46). */
type Moving =
  | { kind: 'release'; item: Release; to: ReleaseStatus }
  | { kind: 'sprint'; item: Milestone; to: MilestoneStatus }
  | null;

const dates = (start: string | null, end: string | null) =>
  start || end ? `${start ?? '…'} → ${end ?? '…'}` : 'No dates';

const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? '' : 's'}`;

const RELEASE_TONE = { PLANNED: 'neutral', ACTIVE: 'active', RELEASED: 'info' } as const;
const SPRINT_TONE = { PLANNED: 'neutral', ACTIVE: 'active', COMPLETED: 'info' } as const;

/** SCR-PROJECT-04: each release with its status and dates, and its sprints under it. */
export function ReleasesTab() {
  const { project } = useProjectOutlet();
  const access = useProjectAccess(project);
  const releases = useReleases(project.key);
  const milestones = useMilestones(project.key);
  const [editing, setEditing] = useState<Editing>(null);
  const [deleting, setDeleting] = useState<Deleting>(null);
  const [moving, setMoving] = useState<Moving>(null);
  const [alert, setAlert] = useState<{ text: string; conflict: boolean } | null>(null);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const canRelease = access.can('release:write');
  const canSprint = access.can('milestone:write');
  const reload = () => void Promise.all([releases.refetch(), milestones.refetch()]);

  if (releases.isError || milestones.isError) {
    return (
      <Alert>
        {msg('MSG-COMMON-01')}
        <Button size="sm" variant="outline" onClick={reload}>
          Try again
        </Button>
      </Alert>
    );
  }

  const releaseList = releases.data ?? [];
  const byRelease = new Map<string, Milestone[]>();
  for (const milestone of milestones.data ?? []) {
    byRelease.set(milestone.releaseId, [...(byRelease.get(milestone.releaseId) ?? []), milestone]);
  }
  // Only the active release starts open (SCR-PROJECT-04).
  const isExpanded = (release: Release) => expanded[release.id] ?? release.status === 'ACTIVE';
  const loading = releases.isPending || milestones.isPending;

  return (
    <section aria-labelledby="releases-heading" aria-busy={loading} className="@container">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <h2 id="releases-heading" className="text-lg font-semibold">
          Releases &amp; sprints
        </h2>
        <div className="flex gap-2">
          {canSprint && releaseList.some((r) => r.status !== 'RELEASED') && (
            <Button variant="outline" onClick={() => setEditing({ kind: 'sprint' })}>
              New sprint
            </Button>
          )}
          {canRelease && (
            <Button onClick={() => setEditing({ kind: 'release' })}>New release</Button>
          )}
        </div>
      </div>
      {alert && (
        <Alert className="mb-4">
          {alert.text}
          {alert.conflict && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                setAlert(null);
                reload();
              }}
            >
              Reload
            </Button>
          )}
        </Alert>
      )}
      {loading && <ReleasesSkeleton />}
      {!loading && releaseList.length === 0 && (
        <p role="status" className="text-muted-foreground">
          No releases yet.
        </p>
      )}

      {!loading && (
        <ul className="flex flex-col gap-4">
          {releaseList.map((release) => (
            <ReleaseItem
              key={release.id}
              release={release}
              sprints={byRelease.get(release.id) ?? []}
              open={isExpanded(release)}
              onToggle={(open) => setExpanded({ ...expanded, [release.id]: open })}
              canRelease={canRelease}
              canSprint={canSprint}
              onEdit={setEditing}
              onDelete={setDeleting}
              onMove={setMoving}
            />
          ))}
        </ul>
      )}

      <ReleaseDialog
        projectKey={project.key}
        open={editing?.kind === 'release'}
        release={editing?.kind === 'release' ? editing.release : undefined}
        onClose={() => setEditing(null)}
      />
      <MilestoneDialog
        projectKey={project.key}
        open={editing?.kind === 'sprint'}
        milestone={editing?.kind === 'sprint' ? editing.milestone : undefined}
        releaseId={editing?.kind === 'sprint' ? editing.releaseId : undefined}
        releases={releaseList}
        onClose={() => setEditing(null)}
      />
      <ConfirmMove
        projectKey={project.key}
        moving={moving}
        onClose={() => setMoving(null)}
        onError={setAlert}
      />
      <ConfirmDelete
        projectKey={project.key}
        deleting={deleting}
        onClose={() => setDeleting(null)}
      />
    </section>
  );
}

function ReleasesSkeleton() {
  return (
    <div className="flex flex-col gap-4">
      <span role="status" className="sr-only">
        Loading releases
      </span>
      {[0, 1, 2].map((n) => (
        <div key={n} aria-hidden="true" className="h-14 animate-pulse rounded-lg border bg-muted" />
      ))}
    </div>
  );
}

function ReleaseItem({
  release,
  sprints,
  open,
  onToggle,
  canRelease,
  canSprint,
  onEdit,
  onDelete,
  onMove,
}: {
  release: Release;
  sprints: Milestone[];
  open: boolean;
  onToggle: (open: boolean) => void;
  canRelease: boolean;
  canSprint: boolean;
  onEdit: (editing: Editing) => void;
  onDelete: (deleting: Deleting) => void;
  onMove: (moving: Moving) => void;
}) {
  const Chevron = open ? ChevronDown : ChevronRight;
  const completed = sprints.filter((sprint) => sprint.status === 'COMPLETED').length;
  const notCompleted = sprints.length - completed;
  // AC-PROJECT-104: Release stays visible but disabled, with the reason, while sprints are open.
  const releaseBlocked = release.status === 'ACTIVE' && notCompleted > 0;
  const blockedId = `release-blocked-${release.id}`;
  const isOpenRelease = release.status !== 'RELEASED';

  // Release actions; on a narrow screen they move into one menu (AC-PROJECT-107).
  const actions: (MenuItem & { name: string; disabled?: boolean })[] = [];
  if (canRelease && isOpenRelease) {
    actions.push({
      label: 'Edit',
      name: `Edit ${release.name}`,
      onSelect: () => onEdit({ kind: 'release', release }),
    });
  }
  if (canRelease && release.status === 'PLANNED') {
    actions.push({
      label: 'Activate',
      name: `Activate ${release.name}`,
      onSelect: () => onMove({ kind: 'release', item: release, to: 'ACTIVE' }),
    });
  }
  if (canRelease && release.status === 'ACTIVE') {
    actions.push({
      label: 'Release',
      name: `Release ${release.name}`,
      disabled: releaseBlocked,
      onSelect: () => onMove({ kind: 'release', item: release, to: 'RELEASED' }),
    });
  }
  if (canRelease && release.status === 'PLANNED' && release.milestoneCount === 0) {
    actions.push({
      label: 'Delete',
      name: `Delete ${release.name}`,
      destructive: true,
      onSelect: () => onDelete({ kind: 'release', item: release }),
    });
  }
  const menuItems = actions.filter((action) => !action.disabled);

  return (
    <li className="rounded-lg border">
      <div className="flex items-start justify-between gap-2 px-4 py-3">
        <div className="flex min-w-0 flex-col gap-1">
          <button
            type="button"
            aria-expanded={open}
            onClick={() => onToggle(!open)}
            className="flex flex-wrap items-center gap-x-2 gap-y-1 text-left"
          >
            <Chevron aria-hidden="true" className="size-4 shrink-0" />
            <span className="font-semibold">{release.name}</span>
            <Badge tone={RELEASE_TONE[release.status]}>
              {RELEASE_STATUS_LABELS[release.status]}
            </Badge>
            <span className="text-sm text-muted-foreground">
              {dates(release.startDate, release.targetDate)}
            </span>
          </button>
          <p className="pl-6 text-sm text-muted-foreground">
            {sprints.length === 0
              ? 'No sprints yet'
              : `${completed} / ${plural(sprints.length, 'sprint')} completed`}
            {isOpenRelease && release.targetDate && ` · ${toTarget(release.targetDate)}`}
            {releaseBlocked && canRelease && (
              <>
                {' · '}
                <span id={blockedId} className="text-warning-foreground">
                  {plural(notCompleted, 'sprint')} not completed
                </span>
              </>
            )}
          </p>
        </div>
        {actions.length > 0 && (
          <>
            <div className="hidden shrink-0 gap-2 @2xl:flex">
              {actions.map((action) => (
                <Button
                  key={action.label}
                  size="sm"
                  variant="outline"
                  aria-label={action.name}
                  disabled={action.disabled}
                  aria-describedby={action.disabled ? blockedId : undefined}
                  onClick={action.onSelect}
                >
                  {action.label}
                </Button>
              ))}
            </div>
            {menuItems.length > 0 && (
              <div className="shrink-0 @2xl:hidden">
                <Menu
                  label={`Actions for ${release.name}`}
                  trigger={<MoreHorizontal aria-hidden="true" className="size-4" />}
                  items={menuItems}
                />
              </div>
            )}
          </>
        )}
      </div>
      {open && (
        <div className="border-t px-4 py-3">
          {sprints.length === 0 ? (
            <p className="text-sm text-muted-foreground">No sprints in this release.</p>
          ) : (
            <>
              <SprintTable
                release={release}
                sprints={sprints}
                canSprint={canSprint}
                onEdit={onEdit}
                onDelete={onDelete}
                onMove={onMove}
              />
              <SprintCards
                sprints={sprints}
                canSprint={canSprint}
                onEdit={onEdit}
                onDelete={onDelete}
                onMove={onMove}
              />
            </>
          )}
          {canSprint && isOpenRelease && (
            <div className="mt-3 flex justify-end">
              <Button
                size="sm"
                variant="outline"
                aria-label={`New sprint in ${release.name}`}
                onClick={() => onEdit({ kind: 'sprint', releaseId: release.id })}
              >
                New sprint
              </Button>
            </div>
          )}
        </div>
      )}
    </li>
  );
}

type SprintListProps = {
  sprints: Milestone[];
  canSprint: boolean;
  onEdit: (editing: Editing) => void;
  onDelete: (deleting: Deleting) => void;
  onMove: (moving: Moving) => void;
};

function sprintDates(sprint: Milestone) {
  return `${sprint.startDate} → ${sprint.endDate} (${plural(sprint.days, 'day')})`;
}

function SprintStatus({ sprint }: { sprint: Milestone }) {
  return (
    <span className="inline-flex flex-wrap items-center gap-1">
      <Badge tone={SPRINT_TONE[sprint.status]}>{MILESTONE_STATUS_LABELS[sprint.status]}</Badge>
      {sprint.status === 'ACTIVE' && (
        <span className="text-muted-foreground">{timeLeft(sprint.endDate)}</span>
      )}
    </span>
  );
}

/** Start / Complete / Edit / Delete, by status. A completed sprint is read-only (BR-PROJECT-45). */
function SprintActions({
  sprint,
  onEdit,
  onDelete,
  onMove,
}: { sprint: Milestone } & Omit<SprintListProps, 'sprints' | 'canSprint'>) {
  return (
    <div className="flex flex-wrap justify-end gap-2">
      {sprint.status === 'PLANNED' && (
        <Button
          size="sm"
          variant="outline"
          aria-label={`Start ${sprint.name}`}
          onClick={() => onMove({ kind: 'sprint', item: sprint, to: 'ACTIVE' })}
        >
          Start
        </Button>
      )}
      {sprint.status === 'ACTIVE' && (
        <Button
          size="sm"
          variant="outline"
          aria-label={`Complete ${sprint.name}`}
          onClick={() => onMove({ kind: 'sprint', item: sprint, to: 'COMPLETED' })}
        >
          Complete
        </Button>
      )}
      {sprint.status !== 'COMPLETED' && (
        <Button
          size="sm"
          variant="outline"
          aria-label={`Edit ${sprint.name}`}
          onClick={() => onEdit({ kind: 'sprint', milestone: sprint })}
        >
          Edit
        </Button>
      )}
      {sprint.status === 'PLANNED' && (
        <Button
          size="sm"
          variant="outline"
          aria-label={`Delete ${sprint.name}`}
          onClick={() => onDelete({ kind: 'sprint', item: sprint })}
        >
          Delete
        </Button>
      )}
    </div>
  );
}

/** The tab is 672 px or wider (container query): a table. */
function SprintTable({
  release,
  sprints,
  canSprint,
  ...actions
}: SprintListProps & { release: Release }) {
  return (
    <table className="hidden w-full text-sm @2xl:table">
      <caption className="sr-only">Sprints of release {release.name}</caption>
      <thead className="text-left text-muted-foreground">
        <tr>
          <th scope="col" className="py-1 pr-4 font-medium">
            Sprint
          </th>
          <th scope="col" className="py-1 pr-4 font-medium">
            Goal
          </th>
          <th scope="col" className="py-1 pr-4 font-medium">
            Dates
          </th>
          <th scope="col" className="py-1 pr-4 font-medium">
            Status
          </th>
          <th scope="col" className="py-1 font-medium">
            <span className="sr-only">Actions</span>
          </th>
        </tr>
      </thead>
      <tbody>
        {sprints.map((sprint) => (
          <tr key={sprint.id} className="border-t">
            <td className="py-2 pr-4 font-medium">{sprint.name}</td>
            <td className="py-2 pr-4">{sprint.goal ?? '—'}</td>
            <td className="py-2 pr-4 whitespace-nowrap">{sprintDates(sprint)}</td>
            <td className="py-2 pr-4">
              <SprintStatus sprint={sprint} />
            </td>
            <td className="py-2 text-right whitespace-nowrap">
              {canSprint && <SprintActions sprint={sprint} {...actions} />}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

/** Narrower tab: one card per sprint, nothing scrolls sideways (AC-PROJECT-107). */
function SprintCards({ sprints, canSprint, ...actions }: SprintListProps) {
  return (
    <ul className="flex flex-col gap-3 @2xl:hidden">
      {sprints.map((sprint) => (
        <li key={sprint.id} className="flex flex-col gap-1 rounded-md border p-3 text-sm">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="font-medium">{sprint.name}</span>
            <SprintStatus sprint={sprint} />
          </div>
          {sprint.goal && <p>{sprint.goal}</p>}
          <p className="text-muted-foreground">{sprintDates(sprint)}</p>
          {canSprint && <SprintActions sprint={sprint} {...actions} />}
        </li>
      ))}
    </ul>
  );
}

const MOVE_TEXT = {
  release: {
    ACTIVE: {
      verb: 'Activate',
      title: (name: string) => `Activate release ${name}?`,
      what: (name: string) => `Release ${name} becomes the active release.`,
    },
    RELEASED: {
      verb: 'Release',
      title: (name: string) => `Release ${name}?`,
      what: (name: string) =>
        `Release ${name} becomes read-only: its name and dates can no longer change.`,
    },
  },
  sprint: {
    ACTIVE: {
      verb: 'Start',
      title: (name: string) => `Start ${name}?`,
      what: (name: string) => `${name} becomes the active sprint.`,
    },
    COMPLETED: {
      verb: 'Complete',
      title: (name: string) => `Complete ${name}?`,
      what: (name: string) =>
        `${name} becomes read-only: its name, goal and dates can no longer change.`,
    },
  },
} as const;

/** BR-PROJECT-46: every status move is confirmed first, because it can't be undone. */
function ConfirmMove({
  projectKey,
  moving,
  onClose,
  onError,
}: {
  projectKey: string;
  moving: Moving;
  onClose: () => void;
  onError: (alert: { text: string; conflict: boolean } | null) => void;
}) {
  const saveRelease = useSaveRelease(projectKey);
  const saveMilestone = useSaveMilestone(projectKey);
  const toast = useToast();
  const pending = saveRelease.isPending || saveMilestone.isPending;

  const text = moving
    ? moving.kind === 'release'
      ? MOVE_TEXT.release[moving.to as 'ACTIVE' | 'RELEASED']
      : MOVE_TEXT.sprint[moving.to as 'ACTIVE' | 'COMPLETED']
    : null;
  const title = moving && text ? text.title(moving.item.name) : '';

  async function confirm() {
    if (!moving) return;
    onError(null);
    try {
      if (moving.kind === 'release') {
        await saveRelease.mutateAsync({
          id: moving.item.id,
          body: { version: moving.item.version, status: moving.to },
        });
      } else {
        await saveMilestone.mutateAsync({
          id: moving.item.id,
          body: { version: moving.item.version, status: moving.to },
        });
      }
      toast(msg('MSG-PROJECT-19'));
    } catch (error) {
      onError({ text: errorText(error), conflict: isConflict(error) });
    }
    onClose();
  }

  return (
    <Dialog
      open={!!moving}
      onClose={onClose}
      role="alertdialog"
      title={title}
      description={
        moving && text ? `${text.what(moving.item.name)} This can't be undone.` : undefined
      }
    >
      <DialogActions>
        <Button variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button disabled={pending} onClick={() => void confirm()}>
          {text?.verb}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

function ConfirmDelete({
  projectKey,
  deleting,
  onClose,
}: {
  projectKey: string;
  deleting: Deleting;
  onClose: () => void;
}) {
  const deleteRelease = useDeleteRelease(projectKey);
  const deleteMilestone = useDeleteMilestone(projectKey);
  const toast = useToast();
  const [error, setError] = useState<string | null>(null);
  const what = deleting?.kind === 'release' ? 'release' : 'sprint';

  function close() {
    setError(null);
    onClose();
  }

  async function confirm() {
    if (!deleting) return;
    setError(null);
    try {
      if (deleting.kind === 'release') await deleteRelease.mutateAsync(deleting.item.id);
      else await deleteMilestone.mutateAsync(deleting.item.id);
      close();
      toast(msg('MSG-PROJECT-19'));
    } catch (failure) {
      setError(errorText(failure));
    }
  }

  return (
    <Dialog
      open={!!deleting}
      onClose={close}
      role="alertdialog"
      title={`Delete ${what} ${deleting?.item.name ?? ''}?`}
      description="This can't be undone."
    >
      {error && <Alert>{error}</Alert>}
      <DialogActions>
        <Button variant="outline" onClick={close}>
          Cancel
        </Button>
        <Button variant="destructive" onClick={() => void confirm()}>
          Delete
        </Button>
      </DialogActions>
    </Dialog>
  );
}

import { useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
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
import { timeLeft } from './milestone-time';
import { MilestoneDialog, ReleaseDialog } from './PlanDialogs';
import { useProjectOutlet } from './project-outlet';
import { errorText, isConflict } from './server-error';

type Editing =
  { kind: 'release'; release?: Release } | { kind: 'milestone'; milestone?: Milestone } | null;
type Deleting = { kind: 'release'; item: Release } | { kind: 'milestone'; item: Milestone } | null;

const dates = (start: string | null, end: string | null) =>
  start || end ? `${start ?? '…'} → ${end ?? '…'}` : 'No dates';

/** SCR-PROJECT-04: each release with its status and dates, and its milestones (sprints) under it. */
export function ReleasesTab() {
  const { project } = useProjectOutlet();
  const access = useProjectAccess(project);
  const releases = useReleases(project.key);
  const milestones = useMilestones(project.key);
  const saveRelease = useSaveRelease(project.key);
  const saveMilestone = useSaveMilestone(project.key);
  const toast = useToast();
  const [editing, setEditing] = useState<Editing>(null);
  const [deleting, setDeleting] = useState<Deleting>(null);
  const [alert, setAlert] = useState<{ text: string; conflict: boolean } | null>(null);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const canRelease = access.can('release:write');
  const canMilestone = access.can('milestone:write');

  async function moveRelease(release: Release, status: ReleaseStatus) {
    setAlert(null);
    try {
      await saveRelease.mutateAsync({ id: release.id, body: { version: release.version, status } });
      toast(msg('MSG-PROJECT-19'));
    } catch (error) {
      setAlert({ text: errorText(error), conflict: isConflict(error) });
    }
  }

  async function moveMilestone(milestone: Milestone, status: MilestoneStatus) {
    setAlert(null);
    try {
      await saveMilestone.mutateAsync({
        id: milestone.id,
        body: { version: milestone.version, status },
      });
      toast(msg('MSG-PROJECT-19'));
    } catch (error) {
      setAlert({ text: errorText(error), conflict: isConflict(error) });
    }
  }

  if (releases.isError || milestones.isError) {
    return (
      <Alert>
        {msg('MSG-COMMON-01')}
        <Button
          size="sm"
          variant="outline"
          onClick={() => void Promise.all([releases.refetch(), milestones.refetch()])}
        >
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

  return (
    <section aria-labelledby="releases-heading" aria-busy={releases.isPending}>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <h2 id="releases-heading" className="text-lg font-semibold">
          Releases &amp; sprints
        </h2>
        <div className="flex gap-2">
          {canMilestone && releaseList.some((r) => r.status !== 'RELEASED') && (
            <Button variant="outline" onClick={() => setEditing({ kind: 'milestone' })}>
              New milestone
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
                void Promise.all([releases.refetch(), milestones.refetch()]);
              }}
            >
              Reload
            </Button>
          )}
        </Alert>
      )}
      {releases.isSuccess && releaseList.length === 0 && (
        <p role="status" className="text-muted-foreground">
          No releases yet.
        </p>
      )}

      <ul className="flex flex-col gap-4">
        {releaseList.map((release) => {
          const open = isExpanded(release);
          const items = byRelease.get(release.id) ?? [];
          const Chevron = open ? ChevronDown : ChevronRight;
          return (
            <li key={release.id} className="rounded-lg border">
              <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-3">
                <button
                  type="button"
                  aria-expanded={open}
                  onClick={() => setExpanded({ ...expanded, [release.id]: !open })}
                  className="flex items-center gap-2 text-left"
                >
                  <Chevron aria-hidden="true" className="size-4" />
                  <span className="font-semibold">{release.name}</span>
                  <Badge tone={release.status === 'ACTIVE' ? 'active' : 'neutral'}>
                    {RELEASE_STATUS_LABELS[release.status]}
                  </Badge>
                  <span className="text-sm text-muted-foreground">
                    {dates(release.startDate, release.targetDate)}
                  </span>
                </button>
                {canRelease && (
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      aria-label={`Edit ${release.name}`}
                      onClick={() => setEditing({ kind: 'release', release })}
                    >
                      Edit
                    </Button>
                    {release.status === 'PLANNED' && (
                      <Button
                        size="sm"
                        variant="outline"
                        aria-label={`Activate ${release.name}`}
                        onClick={() => void moveRelease(release, 'ACTIVE')}
                      >
                        Activate
                      </Button>
                    )}
                    {release.status === 'ACTIVE' && (
                      <Button
                        size="sm"
                        variant="outline"
                        aria-label={`Release ${release.name}`}
                        onClick={() => void moveRelease(release, 'RELEASED')}
                      >
                        Release
                      </Button>
                    )}
                    {release.status === 'PLANNED' && release.milestoneCount === 0 && (
                      <Button
                        size="sm"
                        variant="outline"
                        aria-label={`Delete ${release.name}`}
                        onClick={() => setDeleting({ kind: 'release', item: release })}
                      >
                        Delete
                      </Button>
                    )}
                  </div>
                )}
              </div>
              {open && (
                <div className="border-t px-4 py-3">
                  {items.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No milestones in this release.</p>
                  ) : (
                    <table className="w-full text-sm">
                      <caption className="sr-only">Milestones of release {release.name}</caption>
                      <thead className="text-left text-muted-foreground">
                        <tr>
                          <th scope="col" className="py-1 pr-4 font-medium">
                            Milestone
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
                        {items.map((milestone) => (
                          <tr key={milestone.id} className="border-t">
                            <td className="py-2 pr-4 font-medium">{milestone.name}</td>
                            <td className="py-2 pr-4">{milestone.goal ?? '—'}</td>
                            <td className="py-2 pr-4 whitespace-nowrap">
                              {milestone.startDate} → {milestone.endDate} ({milestone.days}{' '}
                              {milestone.days === 1 ? 'day' : 'days'})
                            </td>
                            <td className="py-2 pr-4">
                              {MILESTONE_STATUS_LABELS[milestone.status]}
                              {milestone.status === 'ACTIVE' && ` · ${timeLeft(milestone.endDate)}`}
                            </td>
                            <td className="py-2 text-right whitespace-nowrap">
                              {canMilestone && (
                                <div className="flex justify-end gap-2">
                                  {milestone.status === 'PLANNED' && (
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      aria-label={`Start ${milestone.name}`}
                                      onClick={() => void moveMilestone(milestone, 'ACTIVE')}
                                    >
                                      Start
                                    </Button>
                                  )}
                                  {milestone.status === 'ACTIVE' && (
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      aria-label={`Complete ${milestone.name}`}
                                      onClick={() => void moveMilestone(milestone, 'COMPLETED')}
                                    >
                                      Complete
                                    </Button>
                                  )}
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    aria-label={`Edit ${milestone.name}`}
                                    onClick={() => setEditing({ kind: 'milestone', milestone })}
                                  >
                                    Edit
                                  </Button>
                                  {milestone.status === 'PLANNED' && (
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      aria-label={`Delete ${milestone.name}`}
                                      onClick={() =>
                                        setDeleting({ kind: 'milestone', item: milestone })
                                      }
                                    >
                                      Delete
                                    </Button>
                                  )}
                                </div>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              )}
            </li>
          );
        })}
      </ul>

      <ReleaseDialog
        projectKey={project.key}
        open={editing?.kind === 'release'}
        release={editing?.kind === 'release' ? editing.release : undefined}
        onClose={() => setEditing(null)}
      />
      <MilestoneDialog
        projectKey={project.key}
        open={editing?.kind === 'milestone'}
        milestone={editing?.kind === 'milestone' ? editing.milestone : undefined}
        releases={releaseList}
        onClose={() => setEditing(null)}
      />
      <ConfirmDelete
        projectKey={project.key}
        deleting={deleting}
        onClose={() => setDeleting(null)}
      />
    </section>
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
  const what = deleting?.kind === 'release' ? 'release' : 'milestone';

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

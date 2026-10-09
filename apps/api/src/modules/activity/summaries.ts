import {
  MILESTONE_STATUS_LABELS,
  RELEASE_STATUS_LABELS,
  ACCESS_LABELS,
  JOB_TITLE_NAMES,
  type JobTitle,
  type MilestoneStatus,
  type ProjectAccess,
  type ReleaseStatus,
} from '@qawm/shared';

/** The sentences of the activity log (DD-PROJECT-02 "Actions and summaries"). */
export const summaries = {
  projectCreated: (actor: string) => `${actor} created the project`,
  projectUpdated: (actor: string) => `${actor} edited the project`,
  projectArchived: (actor: string) => `${actor} archived the project`,
  projectRestored: (actor: string) => `${actor} restored the project`,
  guestVisibilityChanged: (actor: string) => `${actor} changed what Guests can see`,
  memberAdded: (actor: string, member: string, access: ProjectAccess, jobTitle: JobTitle | null) =>
    `${actor} added ${member} as ${ACCESS_LABELS[access]}${jobTitle ? ` (${JOB_TITLE_NAMES[jobTitle]})` : ''}`,
  /** One clause per changed field: "access from Member to Project admin and job title from QA engineer to QA lead". */
  memberUpdated: (
    actor: string,
    member: string,
    access?: { from: ProjectAccess; to: ProjectAccess },
    jobTitle?: { from: JobTitle | null; to: JobTitle | null },
  ) => {
    const title = (value: JobTitle | null) => (value ? JOB_TITLE_NAMES[value] : 'none');
    const parts = [
      access && `access from ${ACCESS_LABELS[access.from]} to ${ACCESS_LABELS[access.to]}`,
      jobTitle && `job title from ${title(jobTitle.from)} to ${title(jobTitle.to)}`,
    ].filter(Boolean);
    return `${actor} changed ${member}'s ${parts.join(' and ')}`;
  },
  memberRemoved: (actor: string, member: string) => `${actor} removed ${member}`,
  memberLeft: (actor: string) => `${actor} left the project`,
  releaseCreated: (actor: string, name: string) => `${actor} created release ${name}`,
  releaseUpdated: (actor: string, name: string) => `${actor} edited release ${name}`,
  releaseDeleted: (actor: string, name: string) => `${actor} deleted release ${name}`,
  releaseStatusChanged: (actor: string, name: string, from: ReleaseStatus, to: ReleaseStatus) =>
    `${actor} moved release ${name} from ${RELEASE_STATUS_LABELS[from]} to ${RELEASE_STATUS_LABELS[to]}`,
  milestoneCreated: (actor: string, name: string) => `${actor} created milestone ${name}`,
  milestoneUpdated: (actor: string, name: string) => `${actor} edited milestone ${name}`,
  milestoneDeleted: (actor: string, name: string) => `${actor} deleted milestone ${name}`,
  milestoneStatusChanged: (
    actor: string,
    name: string,
    from: MilestoneStatus,
    to: MilestoneStatus,
  ) =>
    `${actor} moved milestone ${name} from ${MILESTONE_STATUS_LABELS[from]} to ${MILESTONE_STATUS_LABELS[to]}`,
};

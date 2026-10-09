import {
  MILESTONE_STATUS_LABELS,
  RELEASE_STATUS_LABELS,
  ROLE_LABELS,
  type MilestoneStatus,
  type ProjectRole,
  type ReleaseStatus,
} from '@qawm/shared';

/** The sentences of the activity log (DD-PROJECT-02 "Actions and summaries"). */
export const summaries = {
  projectCreated: (actor: string) => `${actor} created the project`,
  projectUpdated: (actor: string) => `${actor} edited the project`,
  projectArchived: (actor: string) => `${actor} archived the project`,
  projectRestored: (actor: string) => `${actor} restored the project`,
  memberAdded: (actor: string, member: string, role: ProjectRole) =>
    `${actor} added ${member} as ${ROLE_LABELS[role]}`,
  memberRoleChanged: (actor: string, member: string, from: ProjectRole, to: ProjectRole) =>
    `${actor} changed ${member}'s role from ${ROLE_LABELS[from]} to ${ROLE_LABELS[to]}`,
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

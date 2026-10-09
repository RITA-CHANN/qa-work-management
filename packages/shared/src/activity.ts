import { z } from 'zod';

/** Activity log of a project (BR-PROJECT-19..22, DD-PROJECT-02). Entries are never edited or deleted. */

export const ACTIVITY_ACTIONS = [
  'project.created',
  'project.updated',
  'project.archived',
  'project.restored',
  'project.guest_visibility_changed',
  'member.added',
  'member.updated',
  'member.removed',
  'member.left',
  'release.created',
  'release.updated',
  'release.status_changed',
  'release.deleted',
  'milestone.created',
  'milestone.updated',
  'milestone.status_changed',
  'milestone.deleted',
] as const;
export type ActivityAction = (typeof ACTIVITY_ACTIONS)[number];

export const ACTIVITY_ENTITY_TYPES = ['project', 'member', 'release', 'milestone'] as const;
export type ActivityEntityType = (typeof ACTIVITY_ENTITY_TYPES)[number];

/** Old and new value of each changed field: `{ name: { from: 'A', to: 'B' } }`. */
export const activityChangesSchema = z.record(
  z.string(),
  z.object({ from: z.unknown(), to: z.unknown() }),
);
export type ActivityChanges = z.infer<typeof activityChangesSchema>;

export const ACTIVITY_PAGE_SIZE = 20;

/** Query of GET /api/projects/:key/activity (API-PROJECT-12). NFR-PROJECT-05: at most 100 per page. */
export const activityQuerySchema = z.strictObject({
  limit: z.coerce.number().int().min(1).max(100).default(ACTIVITY_PAGE_SIZE),
  cursor: z.string().min(1).optional(),
});

export const activityEntrySchema = z.object({
  id: z.string(),
  action: z.enum(ACTIVITY_ACTIONS),
  entityType: z.enum(ACTIVITY_ENTITY_TYPES),
  entityId: z.string(),
  summary: z.string(),
  changes: activityChangesSchema.nullable(),
  actor: z.object({ id: z.string(), name: z.string() }),
  createdAt: z.iso.datetime(),
});
export type ActivityEntry = z.infer<typeof activityEntrySchema>;

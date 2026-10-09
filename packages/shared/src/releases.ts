import { z } from 'zod';
import { isoDateSchema } from './dates';
import { msg } from './messages';
import { versionSchema } from './projects';

/** Releases of a project (BR-PROJECT-14..18, BR-PROJECT-25). Lifecycle: DD-PROJECT-04. */

export const RELEASE_STATUSES = ['PLANNED', 'ACTIVE', 'RELEASED'] as const;
export const releaseStatusSchema = z.enum(RELEASE_STATUSES);
export type ReleaseStatus = z.infer<typeof releaseStatusSchema>;

/** The only status each status may move to (BR-PROJECT-16). */
export const RELEASE_NEXT: Partial<Record<ReleaseStatus, ReleaseStatus>> = {
  PLANNED: 'ACTIVE',
  ACTIVE: 'RELEASED',
};

export const RELEASE_STATUS_LABELS: Record<ReleaseStatus, string> = {
  PLANNED: 'Planned',
  ACTIVE: 'Active',
  RELEASED: 'Released',
};

/** BR-PROJECT-14: 1–50 characters after trimming. */
export const releaseNameSchema = z
  .string({ error: msg('MSG-PROJECT-13') })
  .trim()
  .min(1, msg('MSG-PROJECT-13'))
  .max(50, msg('MSG-PROJECT-13'));

const optionalDate = isoDateSchema.nullable().optional();

/** BR-PROJECT-15: when both dates are set, the target is on or after the start. */
export function releaseDatesInOrder(startDate?: string | null, targetDate?: string | null) {
  return !startDate || !targetDate || targetDate >= startDate;
}

const datesIssue = { message: msg('MSG-PROJECT-15'), path: ['targetDate'] };

/** Body of POST /api/projects/:key/releases (API-RELEASE-02). A new release is always PLANNED. */
export const releaseCreateSchema = z
  .strictObject({ name: releaseNameSchema, startDate: optionalDate, targetDate: optionalDate })
  .refine((body) => releaseDatesInOrder(body.startDate, body.targetDate), datesIssue);
export type ReleaseCreate = z.input<typeof releaseCreateSchema>;

/**
 * Body of PATCH /api/projects/:key/releases/:id (API-RELEASE-03). Dates sent together are checked here;
 * one date against the stored other one is checked by the API.
 */
export const releaseUpdateSchema = z
  .strictObject({
    version: versionSchema,
    name: releaseNameSchema.optional(),
    startDate: optionalDate,
    targetDate: optionalDate,
    status: releaseStatusSchema.optional(),
  })
  .refine((body) => releaseDatesInOrder(body.startDate, body.targetDate), datesIssue);
export type ReleaseUpdate = z.input<typeof releaseUpdateSchema>;

export const releaseSchema = z.object({
  id: z.string(),
  name: z.string(),
  status: releaseStatusSchema,
  startDate: isoDateSchema.nullable(),
  targetDate: isoDateSchema.nullable(),
  version: z.number().int(),
  milestoneCount: z.number().int(),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
});
export type Release = z.infer<typeof releaseSchema>;

import { z } from 'zod';
import { inclusiveDays, isoDateSchema } from './dates';
import { msg } from './messages';
import { versionSchema } from './projects';

/** Milestones (sprints) inside a release (BR-PROJECT-26..34). Lifecycle: DD-PROJECT-04. */

export const MILESTONE_STATUSES = ['PLANNED', 'ACTIVE', 'COMPLETED'] as const;
export const milestoneStatusSchema = z.enum(MILESTONE_STATUSES);
export type MilestoneStatus = z.infer<typeof milestoneStatusSchema>;

/** The only status each status may move to (BR-PROJECT-31). */
export const MILESTONE_NEXT: Partial<Record<MilestoneStatus, MilestoneStatus>> = {
  PLANNED: 'ACTIVE',
  ACTIVE: 'COMPLETED',
};

export const MILESTONE_STATUS_LABELS: Record<MilestoneStatus, string> = {
  PLANNED: 'Planned',
  ACTIVE: 'Active',
  COMPLETED: 'Completed',
};

/** Default longest milestone in days (BR-PROJECT-28). The API reads its value from MILESTONE_MAX_DAYS. */
export const MILESTONE_MAX_DAYS = 28;

/** BR-PROJECT-27: 1–50 characters after trimming. */
export const milestoneNameSchema = z
  .string({ error: msg('MSG-PROJECT-23') })
  .trim()
  .min(1, msg('MSG-PROJECT-23'))
  .max(50, msg('MSG-PROJECT-23'));

const goalSchema = z
  .string()
  .max(500, 'Goal must be at most 500 characters')
  .nullable()
  .transform((value) => (value?.trim() ? value.trim() : null));

/** True if the milestone is 1 to maxDays days long, counting both ends (BR-PROJECT-28). */
export function milestoneLengthOk(startDate: string, endDate: string, maxDays: number): boolean {
  const days = inclusiveDays(startDate, endDate);
  return days >= 1 && days <= maxDays;
}

/** Body of POST /api/projects/:key/milestones (API-MILESTONE-02), for a given maximum length. */
export function makeMilestoneCreateSchema(maxDays: number) {
  const datesMessage = msg('MSG-PROJECT-24', { maxDays });
  // Missing or not a date: the same message as a wrong length (AC-PROJECT-55).
  const date = z
    .string({ error: datesMessage })
    .refine((value) => isoDateSchema.safeParse(value).success, datesMessage);
  return z
    .strictObject({
      releaseId: z.string({ error: 'Release is required' }).min(1, 'Release is required'),
      name: milestoneNameSchema,
      goal: goalSchema.optional(),
      startDate: date,
      endDate: date,
    })
    .refine((body) => milestoneLengthOk(body.startDate, body.endDate, maxDays), {
      message: datesMessage,
      path: ['endDate'],
    });
}

/** Body of PATCH /api/projects/:key/milestones/:id (API-MILESTONE-03). The release can't change. */
export function makeMilestoneUpdateSchema(maxDays: number) {
  const datesMessage = msg('MSG-PROJECT-24', { maxDays });
  return z
    .strictObject({
      version: versionSchema,
      name: milestoneNameSchema.optional(),
      goal: goalSchema.optional(),
      startDate: isoDateSchema.optional(),
      endDate: isoDateSchema.optional(),
      status: milestoneStatusSchema.optional(),
    })
    .refine(
      (body) =>
        !body.startDate ||
        !body.endDate ||
        milestoneLengthOk(body.startDate, body.endDate, maxDays),
      { message: datesMessage, path: ['endDate'] },
    );
}

export const milestoneCreateSchema = makeMilestoneCreateSchema(MILESTONE_MAX_DAYS);
export type MilestoneCreate = z.input<typeof milestoneCreateSchema>;
export const milestoneUpdateSchema = makeMilestoneUpdateSchema(MILESTONE_MAX_DAYS);
export type MilestoneUpdate = z.input<typeof milestoneUpdateSchema>;

/** Query of GET /api/projects/:key/milestones (API-MILESTONE-01). */
export const milestoneListQuerySchema = z.strictObject({ releaseId: z.string().min(1).optional() });

export const milestoneSchema = z.object({
  id: z.string(),
  releaseId: z.string(),
  name: z.string(),
  goal: z.string().nullable(),
  startDate: isoDateSchema,
  endDate: isoDateSchema,
  /** endDate − startDate + 1 */
  days: z.number().int(),
  status: milestoneStatusSchema,
  version: z.number().int(),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
});
export type Milestone = z.infer<typeof milestoneSchema>;

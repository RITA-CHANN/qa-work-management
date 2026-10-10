import { z } from 'zod';
import { activityEntrySchema } from './activity';
import { isoDateSchema } from './dates';
import { milestoneStatusSchema } from './milestones';
import { jobTitleSchema, projectAccessSchema } from './projects';
import { releaseStatusSchema } from './releases';

/** Days ahead the Deadlines card looks (BR-DASH-05). Overdue items are listed whatever their age. */
export const DEADLINE_WINDOW_DAYS = 14;

/** Areas of the dashboard, each shown only if the caller may see it (BR-GUEST-03). */
export const DASHBOARD_AREAS = ['releases', 'members', 'activity'] as const;
export const dashboardAreaSchema = z.enum(DASHBOARD_AREAS);
export type DashboardArea = z.infer<typeof dashboardAreaSchema>;

export const deadlineSchema = z.object({
  kind: z.enum(['RELEASE_TARGET', 'SPRINT_END']),
  id: z.string(),
  name: z.string(),
  date: isoDateSchema,
  /** Days from `asOf`; negative = overdue. */
  days: z.number().int(),
});
export type Deadline = z.infer<typeof deadlineSchema>;

/**
 * Body of GET /api/projects/:key/dashboard (API-DASH-01). A part the caller may not see is left out;
 * `null` or `[]` means there is nothing to show.
 */
export const projectDashboardSchema = z.object({
  asOf: isoDateSchema,
  areas: z.array(dashboardAreaSchema),
  release: z
    .object({
      id: z.string(),
      name: z.string(),
      status: releaseStatusSchema,
      startDate: isoDateSchema.nullable(),
      targetDate: isoDateSchema.nullable(),
      daysToTarget: z.number().int().nullable(),
      sprints: z.array(
        z.object({ id: z.string(), name: z.string(), status: milestoneStatusSchema }),
      ),
    })
    .nullable()
    .optional(),
  sprint: z
    .object({
      id: z.string(),
      name: z.string(),
      goal: z.string().nullable(),
      startDate: isoDateSchema,
      endDate: isoDateSchema,
      daysLeft: z.number().int(),
    })
    .nullable()
    .optional(),
  deadlines: z.array(deadlineSchema).optional(),
  team: z
    .object({
      total: z.number().int(),
      byAccess: z.record(projectAccessSchema, z.number().int()),
      byJobTitle: z.array(
        z.object({ jobTitle: jobTitleSchema.nullable(), count: z.number().int() }),
      ),
    })
    .optional(),
  activity: z.array(activityEntrySchema).optional(),
});
export type ProjectDashboard = z.infer<typeof projectDashboardSchema>;

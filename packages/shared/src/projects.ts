import { z } from 'zod';
import { msg } from './messages';

/**
 * Projects, members and their roles (Phase 3A). The API, the web forms and the tests validate with the
 * same schemas. Rules: docs/requirements/project/rules.md.
 */

/** The 8 project roles, in display order (Owner first). README "Project roles". */
export const PROJECT_ROLES = [
  'OWNER',
  'PROJECT_MANAGER',
  'QA_LEAD',
  'QA_ENGINEER',
  'TEAM_LEAD',
  'DEVELOPER',
  'STAKEHOLDER',
  'VIEWER',
] as const;

export const projectRoleSchema = z.enum(PROJECT_ROLES);
export type ProjectRole = z.infer<typeof projectRoleSchema>;

/** Names people see, in the UI and in activity summaries. */
export const ROLE_LABELS: Record<ProjectRole, string> = {
  OWNER: 'Owner',
  PROJECT_MANAGER: 'Project manager',
  QA_LEAD: 'QA lead',
  QA_ENGINEER: 'QA engineer',
  TEAM_LEAD: 'Team lead',
  DEVELOPER: 'Developer',
  STAKEHOLDER: 'Stakeholder',
  VIEWER: 'Viewer',
};

/** BR-PROJECT-02: 2–10 upper-case letters or digits, starting with a letter. Same check in the database. */
export const PROJECT_KEY_PATTERN = /^[A-Z][A-Z0-9]{1,9}$/;

/** Key as typed: trimmed and upper-cased, then checked (BR-PROJECT-02). */
export const projectKeySchema = z
  .string({ error: msg('MSG-PROJECT-01') })
  .trim()
  .min(1, msg('MSG-PROJECT-01'))
  .toUpperCase()
  .pipe(z.string().regex(PROJECT_KEY_PATTERN, msg('MSG-PROJECT-02')));

/** BR-PROJECT-04: 3–100 characters after trimming. */
export const projectNameSchema = z
  .string({ error: msg('MSG-PROJECT-03') })
  .trim()
  .min(3, msg('MSG-PROJECT-03'))
  .max(100, msg('MSG-PROJECT-03'));

/** BR-PROJECT-05: optional, at most 2000 characters. An empty text is stored as null. */
export const projectDescriptionSchema = z
  .string()
  .max(2000, msg('MSG-PROJECT-05'))
  .nullable()
  .transform((value) => (value?.trim() ? value : null));

/** `version` read from the server, sent back on every PATCH (DD-PROJECT-03). */
export const versionSchema = z.number({ error: 'Version is required' }).int().min(1);

/** Body of POST /api/projects (API-PROJECT-02). Strict: unknown fields are a 400 (NFR-PROJECT-04). */
export const projectCreateSchema = z.strictObject({
  key: projectKeySchema,
  name: projectNameSchema,
  description: projectDescriptionSchema.optional(),
});
export type ProjectCreate = z.input<typeof projectCreateSchema>;

/** Body of PATCH /api/projects/:key (API-PROJECT-04). The key can never change (BR-PROJECT-03). */
export const projectUpdateSchema = z.strictObject({
  version: versionSchema,
  name: projectNameSchema.optional(),
  description: projectDescriptionSchema.optional(),
});
export type ProjectUpdate = z.input<typeof projectUpdateSchema>;

/** Body of POST …/archive and …/restore: an empty object. */
export const emptyBodySchema = z.strictObject({});

/** Query of GET /api/projects (API-PROJECT-01). */
export const projectListQuerySchema = z.strictObject({
  search: z.string().trim().min(1).max(100).optional(),
  archived: z
    .enum(['true', 'false'])
    .optional()
    .transform((value) => value === 'true'),
});

const isoDateTime = z.iso.datetime();
const isoDate = z.iso.date();
const ref = z.object({ id: z.string(), name: z.string() });

/** One row of the project list (API-PROJECT-01). */
export const projectSummarySchema = z.object({
  key: z.string(),
  name: z.string(),
  archivedAt: isoDateTime.nullable(),
  /** null for an Admin who is not a member (BR-PROJECT-36). */
  myRole: projectRoleSchema.nullable(),
  memberCount: z.number().int(),
  activeRelease: ref.nullable(),
  updatedAt: isoDateTime,
});
export type ProjectSummary = z.infer<typeof projectSummarySchema>;

/** One project (API-PROJECT-03, and the response of every project write). */
export const projectSchema = projectSummarySchema.extend({
  description: z.string().nullable(),
  version: z.number().int(),
  activeMilestone: ref.extend({ endDate: isoDate }).nullable(),
  createdBy: ref,
  createdAt: isoDateTime,
});
export type Project = z.infer<typeof projectSchema>;

/** A member of a project (API-PROJECT-08..10). Never contains password or session data. */
export const memberSchema = z.object({
  userId: z.string(),
  name: z.string(),
  email: z.email(),
  role: projectRoleSchema,
  addedAt: isoDateTime,
});
export type Member = z.infer<typeof memberSchema>;

/** Body of POST /api/projects/:key/members (API-PROJECT-09). */
export const memberAddSchema = z.strictObject({
  userId: z.string({ error: 'User is required' }).min(1, 'User is required'),
  role: projectRoleSchema,
});
export type MemberAdd = z.infer<typeof memberAddSchema>;

/** Body of PATCH /api/projects/:key/members/:userId (API-PROJECT-10). */
export const memberUpdateSchema = z.strictObject({ role: projectRoleSchema });
export type MemberUpdate = z.infer<typeof memberUpdateSchema>;

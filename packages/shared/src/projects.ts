import { z } from 'zod';
import { msg } from './messages';

/**
 * Projects, members and their access (Phase 3A). The API, the web forms and the tests validate with the
 * same schemas. Rules: docs/requirements/project/rules.md.
 */

/**
 * What a member may do in a project (BR-PROJECT-35), Backlog style: a Project admin runs the project, a Member
 * sees it and does the daily work. A System admin (global ADMIN) acts as Project admin everywhere.
 */
export const PROJECT_ACCESS = ['PROJECT_ADMIN', 'MEMBER', 'GUEST'] as const;

export const projectAccessSchema = z.enum(PROJECT_ACCESS);
export type ProjectAccess = z.infer<typeof projectAccessSchema>;

export const ACCESS_LABELS: Record<ProjectAccess, string> = {
  PROJECT_ADMIN: 'Project admin',
  MEMBER: 'Member',
  GUEST: 'Guest',
};

/**
 * What a member does (BR-PROJECT-37): a short key, stored and shown in tables ("Minh · QAL"), and a name.
 * Describes the person only: it never changes what they may do.
 */
export const JOB_TITLES = [
  'QAE',
  'QAL',
  'QAA',
  'PM',
  'PO',
  'BA',
  'DEV',
  'TL',
  'DES',
  'STK',
  'OTH',
] as const;

export const jobTitleSchema = z.enum(JOB_TITLES);
export type JobTitle = z.infer<typeof jobTitleSchema>;

export const JOB_TITLE_NAMES: Record<JobTitle, string> = {
  QAE: 'QA engineer',
  QAL: 'QA lead',
  QAA: 'QA automation engineer',
  PM: 'Project manager',
  PO: 'Product owner',
  BA: 'Business analyst',
  DEV: 'Developer',
  TL: 'Team lead',
  DES: 'Designer',
  STK: 'Stakeholder',
  OTH: 'Other',
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

/** Body of POST /api/projects (API-PROJECT-02), System admins only. Strict: unknown fields are a 400 (NFR-PROJECT-04). */
export const projectCreateSchema = z.strictObject({
  key: projectKeySchema,
  /** BR-PROJECT-01: the first Project admin, an existing user. */
  firstAdminId: z.string({ error: msg('MSG-PROJECT-33') }).min(1, msg('MSG-PROJECT-33')),
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
  /** The caller's access; null for a System admin who is not a member (BR-PROJECT-36). */
  myAccess: projectAccessSchema.nullable(),
  /** Null for a Guest when the project's Guest switch "Members" is off (BR-GUEST-03). */
  memberCount: z.number().int().nullable(),
  /** Null when there is none, or for a Guest when "Releases and sprints" is off (BR-GUEST-03). */
  activeRelease: ref.nullable(),
  updatedAt: isoDateTime,
});
export type ProjectSummary = z.infer<typeof projectSummarySchema>;

/** One project (API-PROJECT-03, and the response of every project write). */
export const projectSchema = projectSummarySchema.extend({
  description: z.string().nullable(),
  version: z.number().int(),
  activeMilestone: ref.extend({ endDate: isoDate }).nullable(),
  /** Areas a Guest of this project may see (BR-GUEST-02). */
  guestAreas: z.array(z.string()),
  createdBy: ref,
  createdAt: isoDateTime,
});
export type Project = z.infer<typeof projectSchema>;

/** A member of a project (API-PROJECT-08..10). Never contains password or session data. */
export const memberSchema = z.object({
  userId: z.string(),
  name: z.string(),
  /** null when a Guest reads the list: Guests see names only (BR-GUEST-05). */
  email: z.email().nullable(),
  access: projectAccessSchema,
  jobTitle: jobTitleSchema.nullable(),
  addedAt: isoDateTime,
});
export type Member = z.infer<typeof memberSchema>;

/** Body of POST /api/projects/:key/members (API-PROJECT-09). */
export const memberAddSchema = z.strictObject({
  userId: z.string({ error: 'User is required' }).min(1, 'User is required'),
  access: projectAccessSchema,
  jobTitle: jobTitleSchema.nullable().optional(),
});
export type MemberAdd = z.infer<typeof memberAddSchema>;

/** Body of PATCH /api/projects/:key/members/:userId (API-PROJECT-10). Fields left out stay as they are. */
export const memberUpdateSchema = z.strictObject({
  access: projectAccessSchema.optional(),
  jobTitle: jobTitleSchema.nullable().optional(),
});
export type MemberUpdate = z.infer<typeof memberUpdateSchema>;

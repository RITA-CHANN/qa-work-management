/**
 * Every text a user can see (errors, validation, status), by message code.
 * Code uses the code, never the text: msg('MSG-AUTH-01'), msg('MSG-COMMON-08', { method, path }).
 *
 * Each code is also a row in docs/requirements/<feature>/messages.md, where the business approves the text.
 * `npm run docs:check` fails if the two differ, or if an app copies a text instead of using msg().
 * Add new messages to the group of their feature, keep them in code order, and write texts as plain
 * '…' strings so the check can read them. `{name}` is a placeholder filled in by msg().
 */
export const MESSAGES = {
  // Common: docs/requirements/common/messages.md
  'MSG-COMMON-01': 'Something went wrong. Please try again.',
  'MSG-COMMON-02': 'Something went wrong. Quote the requestId when reporting this.',
  'MSG-COMMON-03': 'Request body is not valid JSON',
  'MSG-COMMON-04': 'Request validation failed',
  'MSG-COMMON-05': 'Authentication required',
  'MSG-COMMON-06': 'You do not have permission to do this',
  'MSG-COMMON-07': 'Resource not found',
  'MSG-COMMON-08': 'Route {method} {path} does not exist',
  'MSG-COMMON-09': 'Content-Type must be application/json',
  'MSG-COMMON-10': 'Checking…',
  'MSG-COMMON-11': 'Online',
  'MSG-COMMON-12': 'Offline',
  'MSG-COMMON-13': 'Page not found',
  'MSG-COMMON-14': 'The page you are looking for does not exist.',

  // Authentication: docs/requirements/auth/messages.md
  'MSG-AUTH-01': 'Invalid email or password',
  'MSG-AUTH-02': 'Too many login attempts. Please try again later.',
  'MSG-AUTH-03': 'Email is required',
  'MSG-AUTH-04': 'Enter a valid email address',
  'MSG-AUTH-05': 'Password is required',

  // Projects: docs/requirements/project/messages.md
  'MSG-PROJECT-01': 'Key is required',
  'MSG-PROJECT-02': 'Key must be 2–10 letters or digits and start with a letter',
  'MSG-PROJECT-03': 'Name must be 3–100 characters',
  'MSG-PROJECT-04': 'This key is already in use',
  'MSG-PROJECT-05': 'Description must be at most 2000 characters',
  'MSG-PROJECT-06': 'Project not found',
  'MSG-PROJECT-07': 'Someone else changed this project. Reload to see their changes.',
  'MSG-PROJECT-08': 'This project is archived. Restore it to make changes.',
  'MSG-PROJECT-09': 'Only an archived project with no releases can be deleted.',
  'MSG-PROJECT-10': 'Type {key} to confirm',
  'MSG-PROJECT-11': '{name} is already a member of this project',
  'MSG-PROJECT-12': 'A project must have at least one owner',
  'MSG-PROJECT-13': 'Release name must be 1–50 characters',
  'MSG-PROJECT-14': 'A release with this name already exists in this project',
  'MSG-PROJECT-15': 'Target date must be on or after the start date',
  'MSG-PROJECT-16': 'Release status can only move forward',
  'MSG-PROJECT-17': 'Release {name} is already active. Release it first.',
  'MSG-PROJECT-18': 'Only a planned release with no milestones can be deleted',
  'MSG-PROJECT-19': 'Changes saved',
  'MSG-PROJECT-20': 'No projects match your search',
  'MSG-PROJECT-21': 'You are not a member of any project yet. Create one to get started.',
  'MSG-PROJECT-22': 'You cannot change your own role',
  'MSG-PROJECT-23': 'Milestone name must be 1–50 characters',
  'MSG-PROJECT-24': 'A milestone needs a start and end date, 1–{maxDays} days long',
  'MSG-PROJECT-25': 'Milestone dates must be within release {name} ({start} – {end})',
  'MSG-PROJECT-26': 'Overlaps milestone {name} ({start} – {end})',
  'MSG-PROJECT-27': 'Complete all milestones of this release first',
  'MSG-PROJECT-28': 'Milestone status can only move forward',
  'MSG-PROJECT-29': 'Only one milestone can be active, and its release must be active',
  'MSG-PROJECT-30': 'A milestone with this name already exists in this project',
  'MSG-PROJECT-31': 'Only a planned milestone can be deleted',
} as const;

export type MessageCode = keyof typeof MESSAGES;
export type MessageValues = Record<string, string | number>;

/** The text of a message code, with `{name}` placeholders filled from `values`. */
export function msg(code: MessageCode, values?: MessageValues): string {
  const text = MESSAGES[code];
  if (!values) return text;
  return text.replace(/\{(\w+)\}/g, (match, key: string) =>
    key in values ? String(values[key]) : match,
  );
}

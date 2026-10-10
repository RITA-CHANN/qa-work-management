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
  'MSG-PROJECT-12': 'A project must have at least one project admin',
  'MSG-PROJECT-13': 'Release name must be 1–50 characters',
  'MSG-PROJECT-14': 'A release with this name already exists in this project',
  'MSG-PROJECT-15': 'Target date must be on or after the start date',
  'MSG-PROJECT-16': 'Release status can only move forward',
  'MSG-PROJECT-17': 'Release {name} is already active. Release it first.',
  'MSG-PROJECT-18': 'Only a planned release with no milestones can be deleted',
  'MSG-PROJECT-19': 'Changes saved',
  'MSG-PROJECT-20': 'No projects match your search',
  'MSG-PROJECT-21': 'You are not a member of any project yet. Ask an administrator to add you.',
  'MSG-PROJECT-22': 'You cannot change your own access level',
  'MSG-PROJECT-23': 'Milestone name must be 1–50 characters',
  'MSG-PROJECT-24': 'A milestone needs a start and end date, 1–{maxDays} days long',
  'MSG-PROJECT-25': 'Milestone dates must be within release {name} ({start} – {end})',
  'MSG-PROJECT-26': 'Overlaps milestone {name} ({start} – {end})',
  'MSG-PROJECT-27': 'Complete all milestones of this release first',
  'MSG-PROJECT-28': 'Milestone status can only move forward',
  'MSG-PROJECT-29': 'Only one milestone can be active, and its release must be active',
  'MSG-PROJECT-30': 'A milestone with this name already exists in this project',
  'MSG-PROJECT-31': 'Only a planned milestone can be deleted',
  'MSG-PROJECT-32':
    'Release {name} is already released. Add milestones to a planned or active release.',
  'MSG-PROJECT-33': 'Choose an existing user as the first project admin',
  'MSG-PROJECT-34': "The end date can't be before the start date",
  'MSG-PROJECT-35': 'No activity matches these filters',
  'MSG-PROJECT-40': 'Choose a user to add',
  'MSG-PROJECT-41': '{name} will no longer see this project',
  'MSG-PROJECT-42': 'You will lose admin rights in this project',
  'MSG-PROJECT-43': 'No members match these filters',
  'MSG-PROJECT-44': 'No users match "{query}"',
  'MSG-PROJECT-50': 'Project archived',
  'MSG-PROJECT-51': 'Project restored',
  'MSG-PROJECT-52': 'Deleted project {key}',
  'MSG-PROJECT-53': "This project doesn't exist or you don't have access to it.",

  // Admin console: docs/requirements/admin/messages.md
  'MSG-ADMIN-01': 'An account with this email already exists',
  'MSG-ADMIN-02': 'Copy this password now. It will not be shown again.',
  'MSG-ADMIN-03': 'There must be at least one active Admin',
  'MSG-ADMIN-04': 'You cannot change your own role or status',
  'MSG-ADMIN-05':
    '{name} is the only project admin of {projects}. Set another project admin first.',
  'MSG-ADMIN-06': 'This account is deactivated. Contact an administrator.',
  'MSG-ADMIN-07': 'Set a new password to continue',
  'MSG-ADMIN-08': 'You are viewing this project as Admin',
  'MSG-ADMIN-09': 'Only a system administrator can create projects',
  'MSG-ADMIN-10': 'You are not in any project yet. Ask an administrator to add you.',
  'MSG-ADMIN-11': 'Name must be 2–100 characters',
  'MSG-ADMIN-12': 'Password must be 8–200 characters',
  'MSG-ADMIN-13': 'Passwords do not match',
  'MSG-ADMIN-14': 'Choose a password different from the one-time password',
  'MSG-ADMIN-15': 'Password changed',
  'MSG-ADMIN-16': 'User not found',
  'MSG-ADMIN-17': 'Choose an active user as project admin',
  'MSG-ADMIN-18': 'Enter a number of days from 30 to 3650',
  'MSG-ADMIN-19': 'Settings saved',
  'MSG-ADMIN-20': 'No projects in this workspace yet',
  'MSG-ADMIN-21': '{name} is already a project admin. Tick the box to make the others members.',
  'MSG-GUEST-01': 'The project admins have not shared the dashboard with Guests.',
  'MSG-GUEST-02': 'Guest access saved',

  // Shell: docs/requirements/shell/messages.md
  'MSG-SHELL-01': 'No results for "{query}"',

  // Project dashboard: docs/requirements/dashboard/messages.md
  'MSG-DASH-01': 'No release planned yet',
  'MSG-DASH-02': 'No sprint running',
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

const escapeRegExp = (text: string) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// Each text as a pattern, with `{name}` placeholders matching any value.
const PATTERNS = (Object.entries(MESSAGES) as [MessageCode, string][]).map(
  ([code, text]) =>
    [code, new RegExp(`^${escapeRegExp(text).replace(/\\\{\w+\\\}/g, '.+?')}$`)] as const,
);

/**
 * The code of a text built with msg(), e.g. a Zod issue message. Used by the API to add `messageId` to
 * each field error. Returns undefined for texts that are not in the catalog.
 */
export function messageIdOf(text: string): MessageCode | undefined {
  return PATTERNS.find(([, pattern]) => pattern.test(text))?.[0];
}

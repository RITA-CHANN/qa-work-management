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

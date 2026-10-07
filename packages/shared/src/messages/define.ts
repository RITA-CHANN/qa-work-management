/**
 * Declares one user-facing message. Returns the text unchanged; the id is there so
 * `npm run docs:check` can match it with the MSG row in docs/requirements/<feature>/messages.md.
 * Write both arguments as plain string literals so the check can read them.
 */
export function msg<const T extends string>(_id: `MSG-${string}`, text: T): T {
  return text;
}

/** Fills `{name}` placeholders: formatMessage('Route {path} does not exist', { path: '/x' }). */
export function formatMessage(text: string, values: Record<string, string | number>): string {
  return text.replace(/\{(\w+)\}/g, (match, key: string) =>
    key in values ? String(values[key]) : match,
  );
}

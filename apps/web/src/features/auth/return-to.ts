const FALLBACK = '/';
const MAX_LENGTH = 2048;

/**
 * Where to go after login (BR-AUTH-09). Only paths inside this app are allowed:
 * one leading "/" not followed by "/" or "\", so "//evil.com" and full URLs fall back to the dashboard.
 * See docs/design/detail/logic/DD-AUTH-03-web-auth-state.md.
 */
export function safeReturnTo(value: string | null | undefined): string {
  if (!value || value.length > MAX_LENGTH) return FALLBACK;
  if (!/^\/(?![/\\])/.test(value)) return FALLBACK;
  if (value === '/login' || value.startsWith('/login?') || value.startsWith('/login/')) {
    return FALLBACK;
  }
  return value;
}

/** The login URL that brings the user back to `path` afterwards. */
export function loginPathFor(path: string): string {
  const target = safeReturnTo(path);
  return target === FALLBACK ? '/login' : `/login?returnTo=${encodeURIComponent(target)}`;
}

import { z } from 'zod';

/** Exact texts from docs/requirements/auth/messages.md. Tests assert these. */
export const AUTH_MESSAGES = {
  invalidCredentials: 'Invalid email or password', // MSG-AUTH-01
  rateLimited: 'Too many login attempts. Please try again later.', // MSG-AUTH-02
  emailRequired: 'Email is required', // MSG-AUTH-03
  emailInvalid: 'Enter a valid email address', // MSG-AUTH-04
  passwordRequired: 'Password is required', // MSG-AUTH-05
} as const;

/**
 * Body of POST /api/auth/login (API-AUTH-01). Used by the login form and the API,
 * so both show the same field messages. The email is trimmed and lower-cased (BR-AUTH-01).
 */
export const loginRequestSchema = z.object({
  email: z
    .string({ error: AUTH_MESSAGES.emailRequired })
    .trim()
    .min(1, AUTH_MESSAGES.emailRequired)
    .toLowerCase()
    .pipe(z.email(AUTH_MESSAGES.emailInvalid)),
  password: z
    .string({ error: AUTH_MESSAGES.passwordRequired })
    .min(1, AUTH_MESSAGES.passwordRequired)
    .max(200, 'Password is too long'),
});

export type LoginRequest = z.infer<typeof loginRequestSchema>;

/** The logged-in user, returned by login and GET /api/auth/me. Never contains the password hash. */
export const authUserSchema = z.object({
  id: z.string(),
  email: z.email(),
  name: z.string(),
  globalRole: z.enum(['ADMIN', 'USER']),
});

export type AuthUser = z.infer<typeof authUserSchema>;

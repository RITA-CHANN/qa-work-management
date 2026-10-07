import { z } from 'zod';
import { AUTH_MESSAGES } from './messages/auth';

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

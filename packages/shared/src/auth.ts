import { z } from 'zod';
import { msg } from './messages';

/**
 * Body of POST /api/auth/login (API-AUTH-01). Used by the login form and the API,
 * so both show the same field messages. The email is trimmed and lower-cased (BR-AUTH-01).
 */
export const loginRequestSchema = z.object({
  email: z
    .string({ error: msg('MSG-AUTH-03') })
    .trim()
    .min(1, msg('MSG-AUTH-03'))
    .toLowerCase()
    .pipe(z.email(msg('MSG-AUTH-04'))),
  password: z
    .string({ error: msg('MSG-AUTH-05') })
    .min(1, msg('MSG-AUTH-05'))
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

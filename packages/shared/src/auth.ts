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
  /** True until the user replaces a one-time password set by an Admin (BR-ADMIN-07, BR-ADMIN-12). */
  mustChangePassword: z.boolean(),
});

export type AuthUser = z.infer<typeof authUserSchema>;

/** Password rule for passwords people choose (BR-ADMIN-07). */
export const newPasswordSchema = z
  .string({ error: msg('MSG-ADMIN-12') })
  .min(8, msg('MSG-ADMIN-12'))
  .max(200, msg('MSG-ADMIN-12'));

/** Body of POST /api/auth/change-password (API-AUTH-04), used after signing in with a one-time password. */
export const changePasswordSchema = z
  .strictObject({ newPassword: newPasswordSchema, confirmPassword: z.string() })
  .refine((body) => body.newPassword === body.confirmPassword, {
    message: msg('MSG-ADMIN-13'),
    path: ['confirmPassword'],
  });
export type ChangePassword = z.infer<typeof changePasswordSchema>;

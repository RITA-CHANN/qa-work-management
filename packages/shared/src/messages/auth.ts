import { msg } from './define';

/** Business text: docs/requirements/auth/messages.md. */
export const AUTH_MESSAGES = {
  invalidCredentials: msg('MSG-AUTH-01', 'Invalid email or password'),
  rateLimited: msg('MSG-AUTH-02', 'Too many login attempts. Please try again later.'),
  emailRequired: msg('MSG-AUTH-03', 'Email is required'),
  emailInvalid: msg('MSG-AUTH-04', 'Enter a valid email address'),
  passwordRequired: msg('MSG-AUTH-05', 'Password is required'),
} as const;

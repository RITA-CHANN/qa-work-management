import type { AuthUser } from '@qawm/shared';

declare global {
  namespace Express {
    interface Request {
      /** Set by the requestId middleware. */
      requestId: string;
      /** Set by requireAuth on protected routes. */
      user?: AuthUser;
      /** SHA-256 of the session token, set by requireAuth. */
      sessionIdHash?: string;
    }
  }
}

export {};

import { z } from 'zod';

/** Query of GET /api/users (API-USER-01), for the "Add member" picker. */
export const userListQuerySchema = z.strictObject({
  search: z.string().trim().min(1).max(100).optional(),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});

/** A user as the picker shows them. Never the global role or password hash. */
export const userOptionSchema = z.object({ id: z.string(), name: z.string(), email: z.email() });
export type UserOption = z.infer<typeof userOptionSchema>;

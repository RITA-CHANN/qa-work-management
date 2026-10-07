import { z } from 'zod';

export const healthResponseSchema = z.object({
  /** 'degraded' (HTTP 503) when a dependency such as the database is unreachable. */
  status: z.enum(['ok', 'degraded']),
  version: z.string(),
  uptimeSeconds: z.number().nonnegative(),
  database: z.enum(['up', 'down']),
  timestamp: z.iso.datetime(),
});

export type HealthResponse = z.infer<typeof healthResponseSchema>;

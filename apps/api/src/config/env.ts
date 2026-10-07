import { z } from 'zod';
import { resolveDatabaseUrl } from './load-env';

export const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  API_PORT: z.coerce.number().int().min(1).max(65535).default(3000),
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent']).default('info'),
  DATABASE_URL: z
    .string({ error: 'is required (for NODE_ENV=test, set DATABASE_URL_TEST)' })
    .startsWith('postgresql://', { error: 'must start with postgresql://' }),
  AI_PROVIDER: z.enum(['mock', 'anthropic', 'openai']).default('mock'),
  // Auth (BR-AUTH-05, BR-AUTH-04, BR-AUTH-13)
  SESSION_TTL_HOURS: z.coerce.number().int().min(1).max(8760).default(168),
  LOGIN_RATE_LIMIT_MAX: z.coerce.number().int().min(1).max(1000).default(5),
  LOGIN_RATE_LIMIT_WINDOW_MIN: z.coerce.number().int().min(1).max(1440).default(15),
});

export type Env = z.infer<typeof envSchema>;

/**
 * Validates configuration once at startup. A bad .env stops the app immediately
 * with a readable message instead of failing later in a confusing way.
 */
export function parseEnv(raw: NodeJS.ProcessEnv): Env {
  const result = envSchema.safeParse({ ...raw, DATABASE_URL: resolveDatabaseUrl(raw) });
  if (!result.success) {
    const problems = result.error.issues
      .map((issue) => `  - ${issue.path.join('.')}: ${issue.message}`)
      .join('\n');
    throw new Error(`Invalid environment configuration:\n${problems}`);
  }
  return result.data;
}

export const env = parseEnv(process.env);

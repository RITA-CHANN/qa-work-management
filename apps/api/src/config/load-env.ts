import { existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { config } from 'dotenv';

/**
 * Loads the repo-root .env file (one .env for the whole monorepo).
 * Variables already set in the shell win, so NODE_ENV=test etc. can override it.
 */
const rootEnvPath = resolve(dirname(fileURLToPath(import.meta.url)), '../../../../.env');

if (existsSync(rootEnvPath)) {
  config({ path: rootEnvPath, quiet: true });
}

/** In test mode the app and Prisma use the separate test database. */
export function resolveDatabaseUrl(env: NodeJS.ProcessEnv = process.env): string | undefined {
  return env.NODE_ENV === 'test' ? env.DATABASE_URL_TEST : env.DATABASE_URL;
}

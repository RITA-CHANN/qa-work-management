import { defineConfig } from 'prisma/config';
import { resolveDatabaseUrl } from './src/config/load-env';

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
    seed: 'tsx prisma/seed/seed.ts',
  },
  datasource: {
    // NODE_ENV=test points every Prisma command at the test database.
    url: resolveDatabaseUrl() ?? '',
  },
});
